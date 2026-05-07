import { LightningElement, track, wire } from 'lwc';
import searchFamily from '@salesforce/apex/FamilyController.searchFamily';
import createFamilyWithHead from '@salesforce/apex/FamilyController.createFamilyWithHead';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import deleteFamily from '@salesforce/apex/FamilyController.deleteFamily';
import LightningConfirm from 'lightning/confirm';
import updateFamily from '@salesforce/apex/FamilyController.updateFamily';

export default class Family extends LightningElement {

    @track searchKey = '';
    @track isMemberModalOpen = false;
    @track families = [];
    wiredFamilyResult;
    showMemberComponent = false;
    selectedFamilyId;
    familyHeadName = '';
    headAddress = '';
    headAge;
    headPhone = '';
    editRecordId = null;
    
columns = [
    { label: 'Family Name', fieldName: 'Name' },
    { label: 'Family Head', fieldName: 'FamilyHeadName' },

    {
        label: 'View Member',
        type: 'button',
        typeAttributes: {
            label: 'View Member',
            name: 'view_member',
            variant: 'brand',
            iconName:'standard:groups',
            iconPosition:'left'
        }
    },

    //  Dropdown (edit/delete)
    {
        type: 'action',
        typeAttributes: {
            rowActions: [
                { label: 'Edit', name: 'edit' },
                { label: 'Delete', name: 'delete' }
            ]
        }
    }
];

    @track isModalOpen = false;
    @track familyName = '';
    @track familyHeadName = '';
    selectedFamilyId;


    // data fetch
    @wire(searchFamily, { searchKey: '$searchKey' })
    wiredFamilies(result) {
        this.wiredFamilyResult = result;

        if (result.data) {
            this.families = result.data;
        } else if (result.error) {
            console.error(result.error);
        }
    }

    wiredFamilies(result) {
    this.wiredFamilyResult = result;

    if (result.data) {
        this.families = result.data.map(f => {
            return {
                ...f,
                FamilyHeadName: f.FamilyHead__r ? f.FamilyHead__r.Name : ''
            };
        });
    } else if (result.error) {
        console.error(result.error);
    }
}

 handleRowAction(event) {
    const actionName = event.detail.action.name;
    const row = event.detail.row;

    if (actionName === 'edit') {
        this.editRecordId = row.Id;       
        this.familyName = row.Name;
        this.familyHeadName = row.FamilyHeadName; 
        this.isModalOpen = true;
    }

    if (actionName === 'delete') {
        this.deleteFamilyRecord(row.Id);
    }

    if (actionName === 'view_member') {
        this.selectedFamilyId = row.Id;
        this.showMemberComponent = true;
    }
}

     async deleteFamilyRecord(familyId){

    const result = await LightningConfirm.open({
        message: 'Are you sure you want to delete this family?',
        variant: 'header',
        label: 'Confirm Delete'
    });

    if(result){
        deleteFamily({ familyId })
            .then(() => {
                this.showToast('Success','Family Deleted','success');
                return refreshApex(this.wiredFamilyResult);
            })
            .catch(error => {
                console.error(error);
                this.showToast('Error', error.body.message, 'error');
            });
    }
}


    handleSearchChange(event) {
        console.log(event.target.value)
        this.searchKey = event.target.value;
        console.log(this.searchKey)
    }

    // family head info
    handleHeadAddress(e){ this.headAddress = e.target.value; }
    handleHeadAge(e){ this.headAge = e.target.value; }
    handleHeadPhone(e){ this.headPhone = e.target.value; }

    openCreateModal() {
        this.isModalOpen = true;
    }

    closeModal() {
        this.isModalOpen = false;
    }

    handleNameChange(event) {
        this.familyName = event.target.value;
    }

    handleHeadChange(event) {
         this.familyHeadName = event.target.value;
         }

         handleCloseMember(){
    this.isMemberModalOpen = false;
        }
    
    handleBack(){
    this.showMemberComponent = false;
   }


    //Save Record
   saveFamily() {

    if (!this.familyName) {
        this.showToast('Error', 'Family Name required', 'error');
        return;
    }

    
    if (this.editRecordId) {

        updateFamily({
            familyId: this.editRecordId,
            familyName: this.familyName,
            headName: this.familyHeadName
        })
        .then(() => {
            this.showToast('Success', 'Family Updated', 'success');
            this.closeModal();
            this.clearForm();
            this.editRecordId = null; 
            return refreshApex(this.wiredFamilyResult);
        })
        .catch(error => {
            console.error(error);
        });

    } else {

        //  CREATE MODe
        createFamilyWithHead({
            familyName: this.familyName,
            headName: this.familyHeadName
        })
        .then(() => {
            this.showToast('Success', 'Family Created', 'success');
            this.closeModal();
            this.clearForm();
            return refreshApex(this.wiredFamilyResult);
        });
    }
}

    clearForm() {
        this.familyName = '';
    }

    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({ title, message, variant })
        );
    }
}

