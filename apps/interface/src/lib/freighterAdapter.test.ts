/**
 * @jest-environment jsdom
 */

import { freighterAdapter } from "./freighterAdapter";
import * as freighterApi from "@stellar/freighter-api";

// Mock the Freighter API
jest.mock("@stellar/freighter-api");

const mockedRequestAccess = freighterApi.requestAccess as jest.MockedFunction<
  typeof freighterApi.requestAccess
>;
const mockedSignTransaction = freighterApi.signTransaction as jest.MockedFunction<
  typeof freighterApi.signTransaction
>;

describe("freighterAdapter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("metadata", () => {
    it("should have correct name", () => {
      expect(freighterAdapter.name).toBe("Freighter");
    });
  });

  describe("connect", () => {
    it("should successfully connect and return address", async () => {
      const mockAddress = "GBBD47UZQ2QDAAK63XUIFH5FXVLNFSMQC4MLR4LHPWKFG7FMKGV2FI2QI";
      mockedRequestAccess.mockResolvedValue({
        address: mockAddress,
        error: undefined,
      });

      const result = await freighterAdapter.connect();

      expect(result).toBe(mockAddress);
      expect(mockedRequestAccess).toHaveBeenCalledTimes(1);
    });

    it("should throw error when connection fails with error message", async () => {
      const errorMessage = "User rejected the connection request";
      mockedRequestAccess.mockResolvedValue({
        address: undefined,
        error: { message: errorMessage },
      } as any);

      await expect(freighterAdapter.connect()).rejects.toThrow(errorMessage);
      expect(mockedRequestAccess).toHaveBeenCalledTimes(1);
    });

    it("should throw generic error when connection fails without message", async () => {
      mockedRequestAccess.mockResolvedValue({
        address: undefined,
        error: {},
      } as any);

      await expect(freighterAdapter.connect()).rejects.toThrow(
        "Freighter connection failed"
      );
    });

    it("should throw error when Freighter extension is not installed", async () => {
      mockedRequestAccess.mockRejectedValue(new Error("Freighter not installed"));

      await expect(freighterAdapter.connect()).rejects.toThrow(
        "Freighter not installed"
      );
    });

    it("should handle timeout scenarios", async () => {
      mockedRequestAccess.mockImplementation(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Connection timeout")), 100);
          })
      );

      await expect(freighterAdapter.connect()).rejects.toThrow(
        "Connection timeout"
      );
    }, 10000);

    it("should handle user rejection", async () => {
      mockedRequestAccess.mockResolvedValue({
        address: undefined,
        error: { message: "User declined access" },
      } as any);

      await expect(freighterAdapter.connect()).rejects.toThrow(
        "User declined access"
      );
    });
  });

  describe("signTransaction", () => {
    const mockXdr = "AAAAAgAAAAC...base64XDR";
    const mockNetworkPassphrase = "Test SDF Network ; September 2015";
    const mockSignedXdr = "AAAAAgAAAAD...signedBase64XDR";

    it("should successfully sign transaction and return signed XDR", async () => {
      mockedSignTransaction.mockResolvedValue({
        signedTxXdr: mockSignedXdr,
        error: undefined,
      });

      const result = await freighterAdapter.signTransaction(
        mockXdr,
        mockNetworkPassphrase
      );

      expect(result).toBe(mockSignedXdr);
      expect(mockedSignTransaction).toHaveBeenCalledWith(mockXdr, {
        networkPassphrase: mockNetworkPassphrase,
      });
      expect(mockedSignTransaction).toHaveBeenCalledTimes(1);
    });

    it("should throw error when signing fails with error message", async () => {
      const errorMessage = "User rejected the transaction";
      mockedSignTransaction.mockResolvedValue({
        signedTxXdr: undefined,
        error: { message: errorMessage },
      } as any);

      await expect(
        freighterAdapter.signTransaction(mockXdr, mockNetworkPassphrase)
      ).rejects.toThrow(errorMessage);
    });

    it("should throw generic error when signing fails without message", async () => {
      mockedSignTransaction.mockResolvedValue({
        signedTxXdr: undefined,
        error: {},
      } as any);

      await expect(
        freighterAdapter.signTransaction(mockXdr, mockNetworkPassphrase)
      ).rejects.toThrow("Signing failed");
    });

    it("should handle network errors", async () => {
      mockedSignTransaction.mockRejectedValue(new Error("Network error"));

      await expect(
        freighterAdapter.signTransaction(mockXdr, mockNetworkPassphrase)
      ).rejects.toThrow("Network error");
    });

    it("should handle timeout scenarios", async () => {
      mockedSignTransaction.mockImplementation(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Signing timeout")), 100);
          })
      );

      await expect(
        freighterAdapter.signTransaction(mockXdr, mockNetworkPassphrase)
      ).rejects.toThrow("Signing timeout");
    }, 10000);

    it("should handle user rejection of transaction", async () => {
      mockedSignTransaction.mockResolvedValue({
        signedTxXdr: undefined,
        error: { message: "User declined to sign transaction" },
      } as any);

      await expect(
        freighterAdapter.signTransaction(mockXdr, mockNetworkPassphrase)
      ).rejects.toThrow("User declined to sign transaction");
    });

    it("should handle invalid XDR", async () => {
      mockedSignTransaction.mockResolvedValue({
        signedTxXdr: undefined,
        error: { message: "Invalid transaction XDR" },
      } as any);

      await expect(
        freighterAdapter.signTransaction("invalid-xdr", mockNetworkPassphrase)
      ).rejects.toThrow("Invalid transaction XDR");
    });

    it("should pass correct network passphrase", async () => {
      const testnetPassphrase = "Test SDF Network ; September 2015";
      mockedSignTransaction.mockResolvedValue({
        signedTxXdr: mockSignedXdr,
        error: undefined,
      });

      await freighterAdapter.signTransaction(mockXdr, testnetPassphrase);

      expect(mockedSignTransaction).toHaveBeenCalledWith(mockXdr, {
        networkPassphrase: testnetPassphrase,
      });
    });

    it("should pass mainnet network passphrase correctly", async () => {
      const mainnetPassphrase = "Public Global Stellar Network ; September 2015";
      mockedSignTransaction.mockResolvedValue({
        signedTxXdr: mockSignedXdr,
        error: undefined,
      });

      await freighterAdapter.signTransaction(mockXdr, mainnetPassphrase);

      expect(mockedSignTransaction).toHaveBeenCalledWith(mockXdr, {
        networkPassphrase: mainnetPassphrase,
      });
    });
  });

  describe("disconnect", () => {
    it("should not have a disconnect method", () => {
      expect(freighterAdapter.disconnect).toBeUndefined();
    });
  });

  describe("error consistency", () => {
    it("should map connection errors consistently", async () => {
      const errors = [
        "User rejected the connection request",
        "Extension not found",
        "Permission denied",
      ];

      for (const errorMessage of errors) {
        mockedRequestAccess.mockResolvedValue({
          address: undefined,
          error: { message: errorMessage },
        } as any);

        await expect(freighterAdapter.connect()).rejects.toThrow(errorMessage);
      }
    });

    it("should map signing errors consistently", async () => {
      const mockXdr = "AAAAAgAAAAC...base64XDR";
      const mockNetworkPassphrase = "Test SDF Network ; September 2015";
      const errors = [
        "User rejected the transaction",
        "Invalid transaction",
        "Insufficient balance",
      ];

      for (const errorMessage of errors) {
        mockedSignTransaction.mockResolvedValue({
          signedTxXdr: undefined,
          error: { message: errorMessage },
        } as any);

        await expect(
          freighterAdapter.signTransaction(mockXdr, mockNetworkPassphrase)
        ).rejects.toThrow(errorMessage);
      }
    });

    it("should throw Error instances for all failures", async () => {
      mockedRequestAccess.mockResolvedValue({
        address: undefined,
        error: { message: "Test error" },
      } as any);

      try {
        await freighterAdapter.connect();
        fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe("integration scenarios", () => {
    it("should handle connect followed by sign", async () => {
      const mockAddress = "GBBD47UZQ2QDAAK63XUIFH5FXVLNFSMQC4MLR4LHPWKFG7FMKGV2FI2QI";
      const mockXdr = "AAAAAgAAAAC...base64XDR";
      const mockSignedXdr = "AAAAAgAAAAD...signedBase64XDR";
      const mockNetworkPassphrase = "Test SDF Network ; September 2015";

      mockedRequestAccess.mockResolvedValue({
        address: mockAddress,
        error: undefined,
      });
      mockedSignTransaction.mockResolvedValue({
        signedTxXdr: mockSignedXdr,
        error: undefined,
      });

      const address = await freighterAdapter.connect();
      expect(address).toBe(mockAddress);

      const signedXdr = await freighterAdapter.signTransaction(
        mockXdr,
        mockNetworkPassphrase
      );
      expect(signedXdr).toBe(mockSignedXdr);
    });

    it("should handle rapid connect/sign calls", async () => {
      const mockAddress = "GBBD47UZQ2QDAAK63XUIFH5FXVLNFSMQC4MLR4LHPWKFG7FMKGV2FI2QI";
      const mockSignedXdr = "AAAAAgAAAAD...signedBase64XDR";

      mockedRequestAccess.mockResolvedValue({
        address: mockAddress,
        error: undefined,
      });
      mockedSignTransaction.mockResolvedValue({
        signedTxXdr: mockSignedXdr,
        error: undefined,
      });

      const promises = [
        freighterAdapter.connect(),
        freighterAdapter.signTransaction(
          "xdr1",
          "Test SDF Network ; September 2015"
        ),
        freighterAdapter.signTransaction(
          "xdr2",
          "Test SDF Network ; September 2015"
        ),
      ];

      const results = await Promise.all(promises);
      expect(results[0]).toBe(mockAddress);
      expect(results[1]).toBe(mockSignedXdr);
      expect(results[2]).toBe(mockSignedXdr);
    });
  });
});
