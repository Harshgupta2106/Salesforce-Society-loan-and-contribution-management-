import { LightningElement, api, track } from 'lwc';
import createMember from '@salesforce/apex/MemberController.createMember';
import searchFamily from '@salesforce/apex/FamilyController.searchFamily'; 
import { wire } from 'lwc';
import getMembersByFamily from '@salesforce/apex/MemberController.getMembersByFamily';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import deleteMember from '@salesforce/apex/MemberController.deleteMember';
import updateMember from '@salesforce/apex/MemberController.updateMember';
import LightningConfirm from 'lightning/confirm';

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

    familyOptions = [];
    columns = [
    { label: 'Name', fieldName: 'Name' },
    { label: 'Address', fieldName: 'Address__c' },
    { label: 'Age', fieldName: 'Age__c', type: 'number' },
    { label: 'Phone', fieldName: 'Phone__c' },

    {
        type: 'action',
        typeAttributes: {
            rowActions: [
                { label: 'View', name: 'view' },
                { label: 'Edit', name: 'edit' },
                { label: 'Delete', name: 'delete' }
            ]
        }
    }
];

    @wire(getMembersByFamily, { 
    familyId: '$selectedFamilyId',
    searchKey: '$searchKey'
})
wiredMembers(result) {
    this.wiredMemberResult = result;

    if (result.data) {
        this.members = result.data;
    } else if (result.error) {
        console.error(result.error);
    }
}

    connectedCallback(){
        searchFamily({ searchKey: '' })
            .then(result => {
                this.familyOptions = result.map(f => ({
                    label: f.Name,
                    value: f.Id
                }));
            })
            .catch(error => {
                console.error(error);
            });
    }

    handleRowAction(event) {
    const actionName = event.detail.action.name;
    const row = event.detail.row;

    switch(actionName) {

        case 'edit':
            this.editRecordId = row.Id;
            this.memberName = row.Name;
            this.address = row.Address__c;
            this.age = row.Age__c;
            this.phone = row.Phone__c;
            this.isOpen = true; // modal open
            break;

        case 'delete':
            this.deleteMemberRecord(row.Id);
            break;
    }
}

   async deleteMemberRecord(memberId){

    const result = await LightningConfirm.open({
        message: 'Are you sure you want to delete this member?',
        variant: 'header',
        label: 'Confirm Delete'
    });

    if(result){
        deleteMember({ memberId })
            .then(() => {
                this.showToast('Success','Member Deleted','success');
                return refreshApex(this.wiredMemberResult);
            })
            .catch(error => {
                console.error(error);
                this.showToast('Error', error.body.message, 'error');
            });
    }
}

   wiredMemberResult;

@wire(getMembersByFamily, { familyId: '$selectedFamilyId' ,  searchKey: '$searchKey' })
wiredMembers(result) {
    this.wiredMemberResult = result;

    if (result.data) {
        this.members = result.data;
    } else if (result.error) {
        console.error(result.error);
    }
}


    openCreateModal(){
        this.isOpen = true;
    }

    handleMemberName(e){ this.memberName = e.target.value; }
    handleAddress(e){ this.address = e.target.value; }
    handleAge(e){ this.age = e.target.value; }
    handlePhone(e){ this.phone = e.target.value; }

    handleFamilyChange(event){
        this.selectedFamilyId = event.detail.value;
    }

    closeModal(){
        this.dispatchEvent(new CustomEvent('close'));
        this.isOpen = false; // optional but useful
    }

     handleSearchChange(event) {
        this.searchKey = event.target.value;
        console.log(this.searchKey);
    }


    goBack(){
    this.dispatchEvent(new CustomEvent('back'));
    }

    saveMember(){

    if(!this.memberName){
        this.showToast('Error','Member Name required','error');
        return;
    }

    if(this.editRecordId){
        // UPDATE
        updateMember({
            memberId: this.editRecordId,
            name: this.memberName,
            address: this.address,
            age: this.age,
            phone: this.phone
        })
        .then(() => {
            this.showToast('Success','Member Updated','success');
            this.closeModal();
            this.clearForm();
            this.editRecordId = null;
            return refreshApex(this.wiredMemberResult);
        });
    } else {
        
        createMember({
            name: this.memberName,
            familyId: this.selectedFamilyId,
            address: this.address,
            age: this.age,
            phone: this.phone
        })
        .then(() => {
            this.showToast('Success','Member Added','success');
            this.closeModal();
            this.clearForm();
            return refreshApex(this.wiredMemberResult);
        });
    }
}
    clearForm(){
        this.memberName = '';
        this.address = '';
        this.age = null;
        this.phone = '';
    }

    showToast(title, message, variant){
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}