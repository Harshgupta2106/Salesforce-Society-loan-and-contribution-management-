import { LightningElement, api, wire } from 'lwc';

import getLoansByFamily
from '@salesforce/apex/LoanController.getLoansByFamily';

import payEMI
from '@salesforce/apex/LoanController.payEMI';

import { ShowToastEvent }
from 'lightning/platformShowToastEvent';

import { refreshApex }
from '@salesforce/apex';

export default class Loan extends LightningElement {

    @api selectedFamilyId;

    loanData = [];

    wiredLoanResult;

    columns = [

        {
            label: 'Member',
            fieldName: 'MemberName'
        },

        {
            label: 'Loan Amount',
            fieldName: 'loan_amount__c',
            type: 'currency'
        },

        {
            label: 'Monthly EMI',
            fieldName: 'EMI__c',
            type: 'currency'
        },

        {
            label: 'Paid EMI',
            fieldName: 'Paid_EMI_Count__c',
            type: 'number'
        },

        {
            label: 'Remaining EMI',
            fieldName: 'Remaining_EMI__c',
            type: 'number'
        },

        {
            label: 'Status',
            fieldName: 'loan_status__c'
        },

        {
            type: 'button',

            typeAttributes: {

                label: 'Pay EMI',

                name: 'pay_emi',

                variant: 'brand'
            }
        }
    ];

    // ================= FETCH LOANS =================

    @wire(getLoansByFamily, {
        familyId: '$selectedFamilyId'
    })

    wiredLoans(result){

        this.wiredLoanResult = result;

        if(result.data){

            this.loanData = result.data.map(row => {

                return {

                    ...row,

                    MemberName:
                        row.member__r
                        ? row.member__r.Name
                        : ''
                };
            });

            // IMPORTANT
            this.loanData = [...this.loanData];
        }

        else if(result.error){

            console.error(result.error);
        }
    }

    // ================= PAY EMI =================

    handleRowAction(event){

        const actionName =
            event.detail.action.name;

        const row =
            event.detail.row;

        if(actionName === 'pay_emi'){

            payEMI({
                loanId: row.Id
            })

            .then(() => {

                this.showToast(
                    'Success',
                    'EMI Paid Successfully',
                    'success'
                );

                return refreshApex(
                    this.wiredLoanResult
                );
            })

            .then(() => {

                // FORCE UI REFRESH
                this.loanData = [...this.loanData];
            })

            .catch(error => {

                console.error(error);

                this.showToast(
                    'Error',
                    error.body.message,
                    'error'
                );
            });
        }
    }

    // ================= BACK =================

    handleBack(){

        this.dispatchEvent(
            new CustomEvent('back')
        );
    }

    // ================= REFRESH =================

    @api
    async handleRefresh(){

        await refreshApex(
            this.wiredLoanResult
        );

        // force rerender
        this.loanData = [...this.loanData];
    }

    // ================= TOAST =================

    showToast(title, message, variant){

        this.dispatchEvent(

            new ShowToastEvent({

                title,

                message,

                variant
            })
        );
    }
}