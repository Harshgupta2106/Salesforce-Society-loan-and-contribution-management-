public with sharing class LoanController {
   @AuraEnabled
public static void createLoan(Id memberId, Decimal loanAmount){

    // Member Data
    Member__c memberRecord = [

        SELECT Id,
               Name,
               total_contribution__c

        FROM Member__c

        WHERE Id = :memberId

        LIMIT 1
    ];

    // Eligibility Validation
    if(memberRecord.total_contribution__c == null
       || memberRecord.total_contribution__c < 6000){

        throw new AuraHandledException(
            'Member is not eligible for loan. Minimum contribution should be ₹6000.'
        );
    }

    // Active Loan Validation
    List<Loan__c> existingLoan = [

        SELECT Id
        FROM Loan__c
        WHERE member__c = :memberId
        AND loan_status__c = 'Active'
        LIMIT 1
    ];

    if(!existingLoan.isEmpty()){

        throw new AuraHandledException(
            'Member already has an active loan.'
        );
    }

    // Create Loan
    Loan__c loanRecord = new Loan__c(

        member__c = memberId,

        loan_amount__c = loanAmount,

        Paperwork_Fee__c = 200,

        Remaining_EMI__c = 24,

        Tenure__c = 24,

        start_date__c = System.today(),

        loan_status__c = 'Active'
    );

    insert loanRecord;
}

@AuraEnabled
public static void payEMI(Id loanId){

    Loan__c loanRecord = [

        SELECT Id,
               member__c,
               EMI__c,
               Paid_EMI_Count__c,
               Remaining_EMI__c,
               loan_status__c

        FROM Loan__c

        WHERE Id = :loanId

        LIMIT 1
    ];

    // Already closed
    if(loanRecord.loan_status__c == 'Closed'){

        throw new AuraHandledException(
            'Loan already closed'
        );
    }

    // Create EMI Transaction
    Transaction__c transactionRecord =
        new Transaction__c(

            member__c = loanRecord.member__c,

            Type__c = 'EMI',

            Amount__c = loanRecord.EMI__c,

            Payment_Date__c = System.today()
        );

    insert transactionRecord;

    // Update counts
    Integer paidCount = 0;

if(loanRecord.Paid_EMI_Count__c != null){

    paidCount =
        Integer.valueOf(
            loanRecord.Paid_EMI_Count__c
        );
}

    paidCount++;

    loanRecord.Paid_EMI_Count__c =
        paidCount;

    loanRecord.Remaining_EMI__c =
        24 - paidCount;

    // Auto close
    if(paidCount >= 24){

        loanRecord.loan_status__c =
            'Closed';
    }

    update loanRecord;
}

@AuraEnabled(cacheable=true)

public static List<Loan__c>
getLoansByFamily(Id familyId){

    return [

        SELECT Id,
               loan_amount__c,
               EMI__c,
               Paid_EMI_Count__c,
               Remaining_EMI__c,
               loan_status__c,
               member__r.Name

        FROM Loan__c

        WHERE member__r.Family__c = :familyId

        ORDER BY CreatedDate DESC
    ];
}

@AuraEnabled
public static void updateLoanEMI(Id loanId){

    Loan__c loanRecord = [

        SELECT Id,
               Paid_EMI_Count__c,
               Remaining_EMI__c,
               loan_status__c

        FROM Loan__c

        WHERE Id = :loanId

        LIMIT 1
    ];

    Integer paidCount = 0;

    if(loanRecord.Paid_EMI_Count__c != null){

        paidCount =
            Integer.valueOf(
                loanRecord.Paid_EMI_Count__c
            );
    }

    paidCount++;

    loanRecord.Paid_EMI_Count__c =
        paidCount;

    loanRecord.Remaining_EMI__c =
        24 - paidCount;

    // Auto close
    if(paidCount >= 24){

        loanRecord.loan_status__c =
            'Closed';
    }

    update loanRecord;
}

}