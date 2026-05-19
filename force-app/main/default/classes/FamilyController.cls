public with sharing class FamilyController {

    @AuraEnabled(cacheable=true)
    public static List<Family__c> searchFamily(String searchKey){

        String key = '%' + (searchKey == null ? '' : searchKey) + '%';

        return [
            SELECT Id, Name, FamilyHead__c, FamilyHead__r.Name
            FROM Family__c  
            WHERE Name LIKE :key
            ORDER BY Name
            LIMIT 50
        ];
    }

    @AuraEnabled
public static void createFamilyWithHead(
    String familyName,
    String headName,
    String address,
    Integer age,
    String phone
){

    // Family create
    Family__c fam = new Family__c(Name = familyName);
    insert fam;
//create HEAD with full details
    if(!String.isBlank(headName)){

    Member__c head = new Member__c(
        Name = headName,
        Family__c = fam.Id,
        Address__c = address,
        Age__c = age,
        Phone__c = phone
    );

    insert head;

    // Set head
    fam.FamilyHead__c = head.Id;

    update fam;
}
}

  @AuraEnabled
    public static void deleteFamily(Id familyId){
    delete [SELECT Id FROM Family__c WHERE Id = :familyId];
}

   @AuraEnabled
public static void updateFamily(String familyId, String familyName, String headName){

    // 1. Update Family Name
    Family__c fam = new Family__c(
        Id = familyId,
        Name = familyName
    );
    update fam;

    // 2. Create new head member
    Member__c newHead = new Member__c(
        Name = headName,
        Family__c = familyId
    );
    insert newHead;

    // 3. Update head lookup
    fam.FamilyHead__c = newHead.Id;
    update fam;
}

    @AuraEnabled
    public static void updateFamilyHead(Id familyId, Id memberId){

        Family__c fam = new Family__c(
            Id = familyId,
            FamilyHead__c = memberId
        );

        update fam;
    }
    @AuraEnabled
public static void deleteFamilies(List<Id> familyIds){

    delete [

        SELECT Id
        FROM Family__c
        WHERE Id IN :familyIds
    ];
}

}