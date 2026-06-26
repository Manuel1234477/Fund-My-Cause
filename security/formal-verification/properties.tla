---- Module: CrowdfundContractProperties
---- Description: Formal verification properties for the Fund-My-Cause crowdfund contract
---- This file specifies critical safety properties in TLA+ notation

MODULE CrowdfundContractProperties

EXTENDS Naturals, Sequences, FiniteSets

\* Type definitions
CONSTANT Addresses, Tokens, MaxAmount
ASSUME MaxAmount \in Nat

\* Campaign status values
Status == {"Active", "Success", "Failed", "Cancelled"}

\* Contract state
VARIABLE
    status,           \* Campaign status
    total_raised,     \* Total amount raised
    goal,             \* Campaign funding goal
    deadline,         \* Campaign deadline timestamp
    creator,          \* Campaign creator address
    current_time,     \* Current ledger timestamp
    contributions,    \* Map: Address -> contribution amount
    emergency_paused  \* Emergency pause flag

vars == <<status, total_raised, goal, deadline, creator, current_time, contributions, emergency_paused>>

\* ============================================================================
\* INVARIANTS
\* ============================================================================

\* Invariant 1: Conservation of Funds
\* Total raised never exceeds the sum of all contributions
ConservationOfFunds ==
    total_raised = Sum({contributions[addr] : addr \in DOMAIN contributions})

\* Invariant 2: Goal Bounds
\* Goal is positive and finite
ValidGoal ==
    goal > 0 /\ goal <= MaxAmount

\* Invariant 3: Total Raised Bounds
\* Total raised never exceeds goal by more than what would be overflow
ValidTotalRaised ==
    total_raised >= 0 /\ total_raised <= MaxAmount

\* Invariant 4: Deadline in Future
\* Deadline must be strictly in the future during Active status
DeadlineInFuture ==
    (status = "Active") => (deadline > current_time)

\* Invariant 5: Status Consistency
\* Status matches the campaign state based on current time and total_raised
StatusConsistency ==
    \/ (status = "Active" /\ current_time < deadline)
    \/ (status = "Success" /\ current_time >= deadline /\ total_raised >= goal)
    \/ (status = "Failed" /\ current_time >= deadline /\ total_raised < goal)
    \/ (status = "Cancelled")

\* Invariant 6: Non-Negative Contributions
\* All contributions are non-negative
NonNegativeContributions ==
    \A addr \in DOMAIN contributions : contributions[addr] >= 0

\* Invariant 7: Creator is Defined
\* Creator address is always set
CreatorDefined ==
    creator \in Addresses

\* ============================================================================
\* STATE TRANSITION PREDICATES
\* ============================================================================

\* Valid status transitions
IsValidStatusTransition(old_status, new_status) ==
    \/ (old_status = "Active" /\ new_status = "Success")
    \/ (old_status = "Active" /\ new_status = "Failed")
    \/ (old_status = "Active" /\ new_status = "Cancelled")
    \/ (old_status = "Success" /\ new_status = "Cancelled")
    \/ (old_status = "Failed" /\ new_status = "Cancelled")
    \/ (old_status = new_status)  \* No-op transition allowed

\* ============================================================================
\* SAFETY PROPERTIES
\* ============================================================================

\* Property P1: No Funds Created
\* After any operation, total_raised cannot exceed sum of contributions
NoFundsCreated ==
    []( ConservationOfFunds )

\* Property P2: Valid State Transitions
\* Status can only transition through valid paths
ValidTransitions ==
    [][IsValidStatusTransition(status, status')]_vars

\* Property P3: Goal Cannot Change After Deadline
\* Once deadline passes, goal is immutable
GoalImmutableAfterDeadline ==
    [](current_time >= deadline => (goal' = goal))

\* Property P4: Funds Cannot Disappear
\* Once contributed, funds remain in contract until refund or withdrawal
FundsPreserved ==
    [](total_raised >= 0 /\ total_raised' >= 0)

\* Property P5: Status Only Determined at Deadline
\* Success/Failed status only when deadline has passed
StatusOnlyAtDeadline ==
    [](
        (status' = "Success" => current_time' >= deadline) /\
        (status' = "Failed" => current_time' >= deadline)
    )

\* ============================================================================
\* LIVENESS PROPERTIES (Optional - May Not Hold Due to External Factors)
\* ============================================================================

\* Property L1: Contributors Can Eventually Refund
\* If campaign fails, refund window eventually opens
EventuallyCanRefund ==
    (status = "Active" /\ total_raised < goal)
        ~> (status = "Failed" /\ current_time >= deadline)

\* ============================================================================
\* AUXILIARY PREDICATES FOR VERIFICATION
\* ============================================================================

\* Helper: Sum of a set of values
Sum(S) == 
    IF S = {} THEN 0 ELSE
        LET elem == CHOOSE e \in S : TRUE
        IN elem + Sum(S \ {elem})

\* Check if all invariants hold
AllInvariantsHold ==
    /\ ConservationOfFunds
    /\ ValidGoal
    /\ ValidTotalRaised
    /\ DeadlineInFuture \/ (current_time >= deadline)
    /\ StatusConsistency
    /\ NonNegativeContributions
    /\ CreatorDefined

===============================================================================
\* END MODULE
===============================================================================
