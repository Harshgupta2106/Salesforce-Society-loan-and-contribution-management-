import { LightningElement, track, wire } from 'lwc';
import searchFamily from '@salesforce/apex/FamilyController.searchFamily';
import createFamilyWithHead from '@salesforce/apex/FamilyController.createFamilyWithHead';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import deleteFamily from '@salesforce/apex/FamilyController.deleteFamily';
import LightningConfirm from 'lightning/confirm';
import getMembersByFamily from '@salesforce/apex/MemberController.getMembersByFamily';
import updateFamilyHead from '@salesforce/apex/FamilyController.updateFamilyHead';
import updateFamily from '@salesforce/apex/FamilyController.updateFamily';

export default class Family extends LightningElement {

    @track searchKey = '';
    @track families = [];

    wiredFamilyResult;

    showMemberComponent = false;
    selectedFamilyId;

    memberOptions = [];
    selectedHeadId;

    @track isModalOpen = false;
    selectedFamilyIds = [];
    showDeleteButton = false;

    familyName = '';
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
                iconName: 'standard:groups',
                iconPosition: 'left'
            }
        },

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

    // ================= FETCH FAMILIES =================

    @wire(searchFamily, { searchKey: '$searchKey' })
    wiredFamilies(result) {

        this.wiredFamilyResult = result;

        if (result.data) {

            this.families = result.data.map(f => {
                return {
                    ...f,
                    FamilyHeadName: f.FamilyHead__r
                        ? f.FamilyHead__r.Name
                        : ''
                };
            });

        } else if (result.error) {
            console.error(result.error);
        }
    }

    // ================= ROW ACTION =================

    handleRowAction(event) {

        const actionName = event.detail.action.name;
        const row = event.detail.row;

        // VIEW MEMBER
        if (actionName === 'view_member') {

            this.selectedFamilyId = row.Id;
            this.showMemberComponent = true;
        }

        // EDIT
        if (actionName === 'edit') {

            this.editRecordId = row.Id;

            this.familyName = row.Name;

            this.selectedHeadId = row.FamilyHead__c;

            // load members for dropdown
            getMembersByFamily({ familyId: row.Id })
                .then(result => {

                    this.memberOptions = result.map(m => ({
                        label: m.Name,
                        value: m.Id
                    }));

                })
                .catch(error => {
                    console.error(error);
                });

            this.isModalOpen = true;
        }

        // DELETE
        if (actionName === 'delete') {
            this.deleteFamilyRecord(row.Id);
        }
    }

    // ================= DELETE =================

    async deleteFamilyRecord(familyId) {

        const result = await LightningConfirm.open({
            message: 'Are you sure you want to delete this family?',
            variant: 'header',
            label: 'Confirm Delete'
        });

        if (result) {

            deleteFamily({ familyId })
                .then(() => {

                    this.showToast(
                        'Success',
                        'Family Deleted',
                        'success'
                    );

                    return refreshApex(this.wiredFamilyResult);

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

    handleRowSelection(event){

    const rows = event.detail.selectedRows;

    this.selectedFamilyIds = rows.map(row => row.Id);

    this.showDeleteButton =
        this.selectedFamilyIds.length > 0;
}

async deleteSelectedFamilies(){

    const result = await LightningConfirm.open({

        message: 'Delete selected families?',
        variant: 'header',
        label: 'Confirm Delete'
    });

    if(result){

        deleteFamilies({
            familyIds: this.selectedFamilyIds
        })

        .then(() => {

            this.showToast(
                'Success',
                'Families Deleted',
                'success'
            );

            this.selectedFamilyIds = [];

            this.showDeleteButton = false;

            return refreshApex(this.wiredFamilyResult);
        });
    }
}

    // ================= SEARCH =================

    handleSearchChange(event) {

        this.searchKey = event.target.value;
    }

    // ================= HEAD INFO =================

    handleHeadAddress(event) {
        this.headAddress = event.target.value;
    }

    handleHeadAge(event) {
        this.headAge = event.target.value;
    }

    handleHeadPhone(event) {
        this.headPhone = event.target.value;
    }

    // ================= MODAL =================

    openCreateModal() {

        this.isModalOpen = true;

        this.editRecordId = null;

        this.memberOptions = [];
    }

    closeModal() {

        this.isModalOpen = false;

        this.clearForm();
    }

    // ================= HANDLE CHANGE =================

    handleNameChange(event) {

        this.familyName = event.target.value;
    }

    handleHeadChange(event) {

        this.selectedHeadId = event.detail.value;
    }

    handleHeadInput(event){
    this.familyHeadName = event.target.value;
}

    // ================= BACK =================

    handleBack() {

        this.showMemberComponent = false;
    }

    // ================= SAVE FAMILY =================

    saveFamily() {

        if (!this.familyName) {

            this.showToast(
                'Error',
                'Family Name required',
                'error'
            );

            return;
        }

        // ================= EDIT MODE =================

        if (this.editRecordId) {

    updateFamily({
        familyId: this.editRecordId,
        familyName: this.familyName
    })
    .then(() => {

        return updateFamilyHead({
            familyId: this.editRecordId,
            memberId: this.selectedHeadId
        });

    })
    .then(() => {

        this.showToast(
            'Success',
            'Family Updated',
            'success'
        );

        this.closeModal();

        this.editRecordId = null;

        return refreshApex(this.wiredFamilyResult);

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

        // ================= CREATE MODE =================

        else {

            createFamilyWithHead({

                familyName: this.familyName,
                headName: this.familyHeadName,
                address: this.headAddress,
                age: this.headAge,
                phone: this.headPhone

            })
            .then(() => {

                this.showToast(
                    'Success',
                    'Family Created',
                    'success'
                );

                this.closeModal();

                return refreshApex(this.wiredFamilyResult);

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

    // ================= CLEAR FORM =================

    clearForm() {

        this.familyName = '';

        this.familyHeadName = '';

        this.headAddress = '';

        this.headAge = null;

        this.headPhone = '';

        this.selectedHeadId = null;
    }

    // ================= TOAST =================

    showToast(title, message, variant) {

        this.dispatchEvent(
            new ShowToastEvent({
                title,
                message,
                variant
            })
        );
    }
}