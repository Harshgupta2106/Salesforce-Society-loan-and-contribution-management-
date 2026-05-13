import { LightningElement, api, wire } from 'lwc';
import getTransactionsByFamily
from '@salesforce/apex/TransactionController.getTransactionsByFamily';

export default class Transaction extends LightningElement {

    wiredTransactionResult;

    @api selectedFamilyId;

    transactions = [];

    columns = [
    { label: 'Member', fieldName: 'MemberName' },

    {
        label: 'Payment Date', fieldName: 'Payment_Date__c', type: 'date'},

    { label: 'Type', fieldName: 'Type__c' },

    {
        label: 'Amount', fieldName: 'Amount__c', type: 'currency'}
];

   @wire(getTransactionsByFamily, {
    familyId: '$selectedFamilyId'
})
wiredTransactions(result){

    this.wiredTransactionResult = result;

    const { data, error } = result;

    if(data){

        this.transactions = data.map(row => {

            return {

                ...row,

                MemberName:
                    row.member__r
                    ? row.member__r.Name
                    : ''
            };
        });

    }

    else if(error){

        console.error(error);
    }
}

    handleRefreshTransactions(){

    refreshApex(this.wiredTransactionResult);
}

    goBack(){

        this.dispatchEvent(
            new CustomEvent('back')
        );
    }
}