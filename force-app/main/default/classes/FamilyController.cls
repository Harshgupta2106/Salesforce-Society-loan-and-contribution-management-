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

  @AuraEnabled
    public static void deleteFamily(Id familyId){
    delete [SELECT Id FROM Family__c WHERE Id = :familyId];
}

   @AuraEnabled
public static void updateFamily(Id familyId, String familyName){
    Family__c fam = [SELECT Id FROM Family__c WHERE Id = :familyId];
    fam.Name = familyName;
    update fam;
}

}