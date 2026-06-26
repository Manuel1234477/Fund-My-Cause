# Secret Vault Setup Guide

This guide covers setting up and managing a secure secret vault for Fund-My-Cause using HashiCorp Vault or AWS Secrets Manager.

## Overview

A centralized secret vault provides:
- Encrypted secret storage
- Automatic secret rotation
- Audit logging of all access
- Fine-grained access control
- Integration with CI/CD pipelines

## Option 1: HashiCorp Vault (Self-Hosted)

### Prerequisites

- Docker and Docker Compose
- 2GB RAM minimum
- Port 8200 available

### Setup

1. **Initialize Vault**

```bash
# Create vault directory
mkdir -p vault/data vault/config

# Create Vault configuration
cat > vault/config/vault.hcl << 'EOF'
storage "file" {
  path = "/vault/data"
}

listener "tcp" {
  address       = "0.0.0.0:8200"
  tls_disable   = false
  tls_cert_file = "/vault/config/cert.pem"
  tls_key_file  = "/vault/config/key.pem"
}

ui = true
EOF

# Generate self-signed certificate
openssl req -x509 -newkey rsa:4096 -keyout vault/config/key.pem \
  -out vault/config/cert.pem -days 365 -nodes \
  -subj "/CN=vault.local"

# Start Vault
docker run -d \
  --name vault \
  -p 8200:8200 \
  -v $(pwd)/vault/config:/vault/config \
  -v $(pwd)/vault/data:/vault/data \
  -e VAULT_CONFIG_DIR=/vault/config \
  vault:latest server -config=/vault/config/vault.hcl
```

2. **Initialize and Unseal**

```bash
# Initialize Vault (save keys securely!)
docker exec vault vault operator init \
  -key-shares=5 \
  -key-threshold=3

# Unseal Vault (requires 3 of 5 keys)
docker exec vault vault operator unseal <KEY_1>
docker exec vault vault operator unseal <KEY_2>
docker exec vault vault operator unseal <KEY_3>

# Login with root token
docker exec vault vault login <ROOT_TOKEN>
```

3. **Enable Secret Engine**

```bash
# Enable KV v2 secrets engine
docker exec vault vault secrets enable -version=2 kv

# Create secret paths
docker exec vault vault kv put kv/fund-my-cause/stellar \
  secret_key="S..." \
  public_key="G..."

docker exec vault vault kv put kv/fund-my-cause/rpc \
  api_key="..." \
  endpoint="https://soroban-testnet.stellar.org"

docker exec vault vault kv put kv/fund-my-cause/database \
  password="..." \
  host="db.example.com" \
  port="5432"
```

### Access Control

```bash
# Create policy for CI/CD
cat > /tmp/cicd-policy.hcl << 'EOF'
path "kv/data/fund-my-cause/*" {
  capabilities = ["read", "list"]
}

path "kv/metadata/fund-my-cause/*" {
  capabilities = ["list"]
}
EOF

# Apply policy
docker exec vault vault policy write cicd /tmp/cicd-policy.hcl

# Create AppRole for CI/CD
docker exec vault vault auth enable approle
docker exec vault vault write auth/approle/role/cicd \
  token_ttl=1h \
  token_max_ttl=4h \
  policies="cicd"

# Get role ID and secret ID
docker exec vault vault read auth/approle/role/cicd/role-id
docker exec vault vault write -f auth/approle/role/cicd/secret-id
```

## Option 2: AWS Secrets Manager

### Prerequisites

- AWS account with appropriate permissions
- AWS CLI configured
- IAM role for CI/CD

### Setup

```bash
# Create secret for Stellar credentials
aws secretsmanager create-secret \
  --name fund-my-cause/stellar \
  --description "Stellar network credentials" \
  --secret-string '{
    "secret_key": "S...",
    "public_key": "G..."
  }'

# Create secret for RPC configuration
aws secretsmanager create-secret \
  --name fund-my-cause/rpc \
  --description "Soroban RPC configuration" \
  --secret-string '{
    "api_key": "...",
    "endpoint": "https://soroban-testnet.stellar.org"
  }'

# Create secret for database credentials
aws secretsmanager create-secret \
  --name fund-my-cause/database \
  --description "Database credentials" \
  --secret-string '{
    "password": "...",
    "host": "db.example.com",
    "port": 5432
  }'
```

### Rotation Policy

```bash
# Enable automatic rotation
aws secretsmanager rotate-secret \
  --secret-id fund-my-cause/stellar \
  --rotation-rules AutomaticallyAfterDays=90

# Create Lambda function for rotation (see scripts/aws-secret-rotation.sh)
```

## Secret Access Logging

### Vault Audit Logging

```bash
# Enable audit logging
docker exec vault vault audit enable file file_path=/vault/logs/audit.log

# View audit logs
docker exec vault tail -f /vault/logs/audit.log
```

### AWS CloudTrail

```bash
# Enable CloudTrail for Secrets Manager
aws cloudtrail create-trail \
  --name fund-my-cause-secrets-trail \
  --s3-bucket-name fund-my-cause-audit-logs

# Enable logging
aws cloudtrail start-logging \
  --trail-name fund-my-cause-secrets-trail
```

## CI/CD Integration

### GitHub Actions with Vault

```yaml
- name: Fetch secrets from Vault
  env:
    VAULT_ADDR: https://vault.example.com:8200
    VAULT_ROLE_ID: ${{ secrets.VAULT_ROLE_ID }}
    VAULT_SECRET_ID: ${{ secrets.VAULT_SECRET_ID }}
  run: |
    # Authenticate with AppRole
    TOKEN=$(curl -s -X POST \
      $VAULT_ADDR/v1/auth/approle/login \
      -d "{\"role_id\":\"$VAULT_ROLE_ID\",\"secret_id\":\"$VAULT_SECRET_ID\"}" \
      | jq -r '.auth.client_token')
    
    # Fetch secrets
    curl -s -H "X-Vault-Token: $TOKEN" \
      $VAULT_ADDR/v1/kv/data/fund-my-cause/stellar \
      | jq -r '.data.data.secret_key' > /tmp/stellar_key
```

### GitHub Actions with AWS Secrets Manager

```yaml
- name: Fetch secrets from AWS Secrets Manager
  uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: arn:aws:iam::ACCOUNT:role/GitHubActionsRole
    aws-region: us-east-1

- name: Get secrets
  run: |
    aws secretsmanager get-secret-value \
      --secret-id fund-my-cause/stellar \
      --query SecretString \
      --output text | jq -r '.secret_key' > /tmp/stellar_key
```

## Best Practices

1. **Never commit secrets** to version control
2. **Use strong encryption** (AES-256 minimum)
3. **Rotate regularly** (90 days recommended)
4. **Audit all access** with comprehensive logging
5. **Limit permissions** using least privilege principle
6. **Use separate vaults** for dev/staging/production
7. **Backup encryption keys** securely offline
8. **Monitor for unauthorized access** attempts

## Troubleshooting

### Vault Sealed

```bash
# Check status
docker exec vault vault status

# Unseal with keys
docker exec vault vault operator unseal <KEY>
```

### Secret Not Found

```bash
# List available secrets
docker exec vault vault kv list kv/fund-my-cause/

# Check secret metadata
docker exec vault vault kv metadata get kv/fund-my-cause/stellar
```

### Access Denied

```bash
# Verify policy
docker exec vault vault policy read cicd

# Check token capabilities
docker exec vault vault token lookup
```

## References

- [HashiCorp Vault Documentation](https://www.vaultproject.io/docs)
- [AWS Secrets Manager Documentation](https://docs.aws.amazon.com/secretsmanager/)
- [OWASP Secret Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
