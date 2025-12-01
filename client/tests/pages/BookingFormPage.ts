import { Page, expect } from '@playwright/test';

export class BookingFormPage {
  constructor(private page: Page) {}

  // Locators
  private get computerSelect() {
    return this.page.locator('[data-testid="computer-select"]');
  }

  private get startDatePicker() {
    return this.page.locator('input[name="startDate"]');
  }

  private get endDatePicker() {
    return this.page.locator('input[name="endDate"]');
  }

  private get startTimePicker() {
    return this.page.locator('input[name="startTime"]');
  }

  private get endTimePicker() {
    return this.page.locator('input[name="endTime"]');
  }

  private get reasonInput() {
    return this.page.locator('textarea[name="reason"]');
  }

  private get requiresGPUCheckbox() {
    return this.page.locator('input[name="requiresGPU"]');
  }

  private get gpuMemoryInput() {
    return this.page.locator('input[name="gpuMemoryRequired"]');
  }

  private get problemStatementInput() {
    return this.page.locator('textarea[name="problemStatement"]');
  }

  private get datasetTypeSelect() {
    return this.page.locator('[data-testid="dataset-type-select"]');
  }

  private get datasetSizeInput() {
    return this.page.locator('input[name="datasetSize"]');
  }

  private get datasetUnitSelect() {
    return this.page.locator('[data-testid="dataset-unit-select"]');
  }

  private get datasetLinkInput() {
    return this.page.locator('input[name="datasetLink"]');
  }

  private get mentorInput() {
    return this.page.locator('input[name="mentor"]');
  }

  private get submitButton() {
    return this.page.locator('button[type="submit"]');
  }

  private get cancelButton() {
    return this.page.locator('button:has-text("Cancel")');
  }

  private get errorMessage() {
    return this.page.locator('[role="alert"]');
  }

  private get successMessage() {
    return this.page.locator('.MuiAlert-standardSuccess');
  }

  // Actions
  async goto() {
    await this.page.goto('/book');
  }

  async selectComputer(computerName: string) {
    await this.computerSelect.click();
    await this.page.locator(`li:has-text("${computerName}")`).click();
  }

  async setStartDate(date: string) {
    await this.startDatePicker.fill(date);
  }

  async setEndDate(date: string) {
    await this.endDatePicker.fill(date);
  }

  async setStartTime(time: string) {
    await this.startTimePicker.fill(time);
  }

  async setEndTime(time: string) {
    await this.endTimePicker.fill(time);
  }

  async setReason(reason: string) {
    await this.reasonInput.fill(reason);
  }

  async enableGPURequirement() {
    await this.requiresGPUCheckbox.check();
  }

  async setGPUMemory(memory: string) {
    await this.gpuMemoryInput.fill(memory);
  }

  async setProblemStatement(statement: string) {
    await this.problemStatementInput.fill(statement);
  }

  async selectDatasetType(type: string) {
    await this.datasetTypeSelect.click();
    await this.page.locator(`li:has-text("${type}")`).click();
  }

  async setDatasetSize(size: string, unit: string) {
    await this.datasetSizeInput.fill(size);
    await this.datasetUnitSelect.click();
    await this.page.locator(`li:has-text("${unit}")`).click();
  }

  async setDatasetLink(link: string) {
    await this.datasetLinkInput.fill(link);
  }

  async setMentor(mentor: string) {
    await this.mentorInput.fill(mentor);
  }

  async submitBooking() {
    await this.submitButton.click();
  }

  async cancelBooking() {
    await this.cancelButton.click();
  }

  async fillBasicBookingForm(data: {
    computer: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    reason: string;
  }) {
    await this.selectComputer(data.computer);
    await this.setStartDate(data.startDate);
    await this.setEndDate(data.endDate);
    await this.setStartTime(data.startTime);
    await this.setEndTime(data.endTime);
    await this.setReason(data.reason);
  }

  async fillAdvancedBookingForm(data: {
    computer: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    reason: string;
    requiresGPU: boolean;
    gpuMemory?: string;
    problemStatement?: string;
    datasetType?: string;
    datasetSize?: string;
    datasetUnit?: string;
    datasetLink?: string;
    mentor?: string;
  }) {
    await this.fillBasicBookingForm(data);
    
    if (data.requiresGPU) {
      await this.enableGPURequirement();
      
      if (data.gpuMemory) {
        await this.setGPUMemory(data.gpuMemory);
      }
    }
    
    if (data.problemStatement) {
      await this.setProblemStatement(data.problemStatement);
    }
    
    if (data.datasetType) {
      await this.selectDatasetType(data.datasetType);
    }
    
    if (data.datasetSize && data.datasetUnit) {
      await this.setDatasetSize(data.datasetSize, data.datasetUnit);
    }
    
    if (data.datasetLink) {
      await this.setDatasetLink(data.datasetLink);
    }
    
    if (data.mentor) {
      await this.setMentor(data.mentor);
    }
  }

  // Assertions
  async expectToBeVisible() {
    await expect(this.computerSelect).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  async expectErrorMessage(message: string) {
    await expect(this.errorMessage).toContainText(message);
  }

  async expectSuccessMessage(message: string) {
    await expect(this.successMessage).toContainText(message);
  }

  async expectBookingSubmitted() {
    await expect(this.page).toHaveURL(/\/(dashboard|computers)/);
  }

  async expectFormValidationError(field: string) {
    const fieldLocator = this.page.locator(`[name="${field}"]`);
    await expect(fieldLocator).toHaveAttribute('aria-invalid', 'true');
  }

  async expectGPUFieldsVisible() {
    await expect(this.gpuMemoryInput).toBeVisible();
  }

  async expectGPUFieldsHidden() {
    await expect(this.gpuMemoryInput).toBeHidden();
  }
}
