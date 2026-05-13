public with sharing class TransactionController {
    @AuraEnabled(cacheable=true)
public static List<Transaction__c> getTransactionsByFamily(Id familyId){

    return [
        SELECT Id,
            Payment_Date__c,
            Type__c,
            Amount__c,
            member__c,
            member__r.Name
        FROM Transaction__c
        WHERE member__r.Family__c = :familyId
        ORDER BY CreatedDate DESC
    ];
}
    @AuraEnabled
public static void createTransaction(
    Id memberId,
    Date paymentDate,
    String type,
    Decimal amount
){

    Transaction__c trans = new Transaction__c(

        member__c = memberId,
        Payment_Date__c = paymentDate,
        Type__c = type,
        Amount__c = amount
    );

    insert trans;
}
}
