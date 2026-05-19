public with sharing class MemberController {

   @AuraEnabled
public static void createMember(String name, Id familyId, String address, Integer age, String phone){

    Member__c mem = new Member__c(
        Name = name,
        Family__c = familyId,
        Address__c = address,
        Age__c = age,
        Phone__c = phone
    );

    insert mem;
}

      @AuraEnabled(cacheable=true)
        public static List<Member__c> getMembersByFamily(Id familyId, String searchKey){

        String key = '%' + (searchKey == null ? '' : searchKey) + '%';

        return [
            SELECT Id, Name, Address__c, Age__c, Phone__c,total_contribution__c
            FROM Member__c
            WHERE Family__c = :familyId
            AND Name LIKE :key
            ORDER BY Name
        ];
}

@AuraEnabled
public static void deleteMembers(List<Id> memberIds){

    delete [

        SELECT Id
        FROM Member__c
        WHERE Id IN :memberIds
    ];
}


    @AuraEnabled
public static void deleteMember(Id memberId){
    delete [SELECT Id FROM Member__c WHERE Id = :memberId];
}

   @AuraEnabled
   public static void updateMember(Id memberId, String name, String address, Integer age, String phone){

    Member__c mem = [SELECT Id FROM Member__c WHERE Id = :memberId];

    mem.Name = name;
    mem.Address__c = address;
    mem.Age__c = age;
    mem.Phone__c = phone;

    update mem;
  }
}