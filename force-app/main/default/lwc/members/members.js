import { LightningElement, api, wire } from 'lwc';
import createMember from '@salesforce/apex/MemberController.createMember';
import searchFamily from '@salesforce/apex/FamilyController.searchFamily';
import getMembersByFamily from '@salesforce/apex/MemberController.getMembersByFamily';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import deleteMember from '@salesforce/apex/MemberController.deleteMember';
import updateMember from '@salesforce/apex/MemberController.updateMember';
import LightningConfirm from 'lightning/confirm';
import createTransaction from '@salesforce/apex/TransactionController.createTransaction';
import deleteMembers from '@salesforce/apex/MemberController.deleteMembers';
import createLoan from '@salesforce/apex/LoanController.createLoan';
import getActiveLoan from '@salesforce/apex/MemberController.getActiveLoan';
import updateLoanEMI from '@salesforce/apex/LoanController.updateLoanEMI';

export default class Member extends LightningElement {

    members = [];
    @api selectedFamilyId;
    @api isOpen = false;
    searchKey = '';
    memberName = '';
    address = '';
    age;
    phone = '';
    editRecordId;
    selectedFamilyName = '';
    showViewModal = false;
    viewMemberData;
    showTransactionModal = false;
    selectedMemberId;
    selectedMemberName = '';
    paymentDate;
    type = '';
    amount;
    showTransactionComponent = false;
    selectedMemberIds = [];
    showDeleteButton = false;
    showLoanDashboard = false;
    showLoanModal = false;
    loanAmount;
    calculatedEMI;
    activeLoanId;
    familyOptions = [];

    columns = [

        { label: 'Name', fieldName: 'Name' },

        { label: 'Address', fieldName: 'Address__c' },

        { label: 'Age', fieldName: 'Age__c', type: 'number' },

        { label: 'Phone', fieldName: 'Phone__c' },

        {
            label: 'Total Contribution',
            fieldName: 'total_contribution__c',
            type: 'currency'
        },

        {
            label: 'Apply Loan',
            type: 'button',
            typeAttributes: {
                label: 'Apply Loan',
                name: 'apply_loan',
                variant: 'brand'
            }
        },

        {
            type: 'action',

            typeAttributes: {

                rowActions: [

                    { label: 'View', name: 'view' },

                    { label: 'Edit', name: 'edit' },

                    { label: 'Delete', name: 'delete' },

                    { label: 'Add Transaction', name: 'transaction' }
                ]
            }
        }
    ];

    typeOptions = [

        {
            label: 'Contribution',
            value: 'Contribution'
        },

        {
            label: 'EMI',
            value: 'EMI'
        }
    ];

    // ================= CONNECTED CALLBACK =================

    connectedCallback(){

        console.log('COMPONENT LOADED');

        searchFamily({ searchKey: '' })

        .then(result => {

            this.familyOptions = result.map(f => ({

                label: f.Name,

                value: f.Id
            }));

            if(this.selectedFamilyId){

                const selectedFamily = result.find(

                    f => f.Id === this.selectedFamilyId
                );

                if(selectedFamily){

                    this.selectedFamilyName =
                        selectedFamily.Name;
                }
            }
        })

        .catch(error => {

            console.error(error);
        });
    }

    // ================= TABLE ACTION =================

    handleRowAction(event){

        const actionName =
            event.detail.action.name;

        const row =
            event.detail.row;

        switch(actionName){

            case 'view':

                this.viewMemberData = row;

                this.showViewModal = true;

                break;

            case 'edit':

                this.editRecordId = row.Id;

                this.memberName = row.Name;

                this.address = row.Address__c;

                this.age = row.Age__c;

                this.phone = row.Phone__c;

                this.isOpen = true;

                break;

            case 'delete':

                this.deleteMemberRecord(row.Id);

                break;

            case 'transaction':

                this.selectedMemberId = row.Id;

                this.selectedMemberName = row.Name;

                this.showTransactionModal = true;

                break;

            case 'apply_loan':

                this.selectedMemberId = row.Id;

                this.selectedMemberName = row.Name;

                this.showLoanModal = true;

                break;
        }
    }

    // ================= FETCH MEMBERS =================

    wiredMemberResult;

    @wire(getMembersByFamily, {

        familyId: '$selectedFamilyId',

        searchKey: '$searchKey'
    })

    wiredMembers(result){

        this.wiredMemberResult = result;

        if(result.data){

            this.members = result.data;

        } else if(result.error){

            console.error(result.error);
        }
    }

    // ================= SEARCH =================

    handleSearchChange(event){

        this.searchKey = event.target.value;
    }

    // ================= INPUT =================

    handleMemberName(e){
        this.memberName = e.target.value;
    }

    handleAddress(e){
        this.address = e.target.value;
    }

    handleAge(e){
        this.age = e.target.value;
    }

    handlePhone(e){
        this.phone = e.target.value;
    }

    handlePaymentDate(event){

        this.paymentDate = event.target.value;
    }

    // ================= TYPE =================

    handleType(event){

        this.type = event.detail.value;

        // CONTRIBUTION
        if(this.type === 'Contribution'){

            this.amount = 500;

            return;
        }

        // EMI
        if(this.type === 'EMI'){

            if(!this.selectedMemberId){

                this.showToast(
                    'Error',
                    'Member not selected',
                    'error'
                );

                return;
            }

            getActiveLoan({

                memberId: this.selectedMemberId

            })

            .then(result => {

                console.log(
                    'Loan Result => ',
                    result
                );

                if(result){

                    this.activeLoanId =
                        result.Id;

                    this.amount =
                        result.EMI__c;

                }

                else{

                    this.activeLoanId = null;

                    this.amount = null;

                    this.showToast(
                        'Error',
                        'No active loan found',
                        'error'
                    );
                }
            })

            .catch(error => {

                console.error(error);

                this.showToast(
                    'Error',
                    'Loan Fetch Failed',
                    'error'
                );
            });
        }
    }

    handleAmount(event){

        this.amount = event.target.value;
    }

    // ================= LOAN =================

    handleLoanAmount(event){

        this.loanAmount = event.target.value;

        if(this.loanAmount){

            this.calculatedEMI =
                (this.loanAmount / 24)
                .toFixed(2);
        }
    }

    applyLoan(){

        createLoan({

            memberId: this.selectedMemberId,

            loanAmount: this.loanAmount
        })

        .then(() => {

            this.showToast(
                'Success',
                'Loan Applied Successfully',
                'success'
            );

            this.closeLoanModal();

                    this.showLoanDashboard = false;

                    setTimeout(() => {

                    this.showLoanDashboard = true;

                    }, 100);
        })

        .catch(error => {

            this.showToast(
                'Error',
                error.body.message,
                'error'
            );
        });
    }

    // ================= TRANSACTION =================

    payTransaction(){

    // Contribution validation
    if(
        this.type === 'Contribution'
        && this.amount < 500
    ){

        this.showToast(
            'Error',
            'Contribution cannot be less than ₹500',
            'error'
        );

        return;
    }

    // SAVE TRANSACTION
    createTransaction({

        memberId: this.selectedMemberId,

        type: this.type,

        amount: this.amount,

        paymentDate: this.paymentDate
    })

    // EMI UPDATE
    .then(() => {

        if(
            this.type === 'EMI'
            && this.activeLoanId
        ){

            return updateLoanEMI({

                loanId: this.activeLoanId
            });
        }

        return null;
    })

    // AFTER EVERYTHING COMPLETE
    .then(() => {

        this.showToast(
            'Success',
            'Payment Successful',
            'success'
        );

        this.closeTransactionModal();

        // MEMBER TABLE REFRESH
        refreshApex(
            this.wiredMemberResult
        );

        // LOAN DASHBOARD REFRESH
        if(
            this.type === 'EMI'
            && this.refs.loanCmp
        ){

            this.refs.loanCmp
                .handleRefresh();
        }
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
                
    // ================= DELETE =================

    async deleteMemberRecord(memberId){

        const result =
            await LightningConfirm.open({

            message:
                'Are you sure you want to delete this member?',

            variant: 'header',

            label: 'Confirm Delete'
        });

        if(result){

            deleteMember({ memberId })

            .then(() => {

                this.showToast(
                    'Success',
                    'Member Deleted',
                    'success'
                );

                return refreshApex(
                    this.wiredMemberResult
                );
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

    // ================= MULTIPLE DELETE =================

    handleRowSelection(event){

        const rows =
            event.detail.selectedRows;

        this.selectedMemberIds =
            rows.map(row => row.Id);

        this.showDeleteButton =
            this.selectedMemberIds.length > 0;
    }

    async deleteSelectedMembers(){

        const result =
            await LightningConfirm.open({

            message:
                'Delete selected members?',

            variant: 'header',

            label: 'Confirm Delete'
        });

        if(result){

            deleteMembers({

                memberIds:
                    this.selectedMemberIds
            })

            .then(() => {

                this.showToast(
                    'Success',
                    'Members Deleted',
                    'success'
                );

                this.selectedMemberIds = [];

                this.showDeleteButton = false;

                return refreshApex(
                    this.wiredMemberResult
                );
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

    // ================= SAVE MEMBER =================

    saveMember(){

        const phoneRegex =
            /^[0-9]{10}$/;

        if(!phoneRegex.test(this.phone)){

            this.showToast(
                'Error',
                'Phone number must be exactly 10 digits',
                'error'
            );

            return;
        }

        if(!this.memberName){

            this.showToast(
                'Error',
                'Member Name required',
                'error'
            );

            return;
        }

        // UPDATE
        if(this.editRecordId){

            updateMember({

                memberId: this.editRecordId,

                name: this.memberName,

                address: this.address,

                age: this.age,

                phone: this.phone
            })

            .then(() => {

                this.showToast(
                    'Success',
                    'Member Updated',
                    'success'
                );

                this.closeModal();

                this.clearForm();

                this.editRecordId = null;

                return refreshApex(
                    this.wiredMemberResult
                );
            });
        }

        // CREATE
        else{

            createMember({

                name: this.memberName,

                familyId: this.selectedFamilyId,

                address: this.address,

                age: this.age,

                phone: this.phone
            })

            .then(() => {

                this.showToast(
                    'Success',
                    'Member Added',
                    'success'
                );

                this.closeModal();

                this.clearForm();

                return refreshApex(
                    this.wiredMemberResult
                );
            });
        }
    }

    // ================= MODAL =================

    openCreateModal(){

        this.isOpen = true;
    }

    closeModal(){

        this.isOpen = false;
    }

    closeViewModal(){

        this.showViewModal = false;
    }

    closeTransactionModal(){

        this.showTransactionModal = false;
    }

    closeLoanModal(){

        this.showLoanModal = false;
    }

    // ================= DASHBOARD =================

    openTransactionDashboard(){

        this.showTransactionComponent = true;
    }

    handleTransactionBack(){

        this.showTransactionComponent = false;
    }

    openLoanDashboard(){

        this.showLoanDashboard = true;
    }

    closeLoanDashboard(){

        this.showLoanDashboard = false;
    }

    // ================= BACK =================

    goBack(){

        this.dispatchEvent(
            new CustomEvent('back')
        );
    }

    // ================= CLEAR =================

    clearForm(){

        this.memberName = '';

        this.address = '';

        this.age = null;

        this.phone = '';
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