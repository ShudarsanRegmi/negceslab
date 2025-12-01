import { Page, expect } from '@playwright/test';

export class ComputerGridPage {
  constructor(private page: Page) {}

  // Locators
  private get computerCards() {
    return this.page.locator('[data-testid="computer-card"]');
  }

  private get searchInput() {
    return this.page.locator('input[placeholder*="Search"]');
  }

  private get statusFilter() {
    return this.page.locator('[data-testid="status-filter"]');
  }

  private get gridViewButton() {
    return this.page.locator('[data-testid="grid-view"]');
  }

  private get listViewButton() {
    return this.page.locator('[data-testid="list-view"]');
  }

  private get bookingDialog() {
    return this.page.locator('[role="dialog"]');
  }

  private get calendarDialog() {
    return this.page.locator('[data-testid="calendar-dialog"]');
  }

  // Actions
  async goto() {
    await this.page.goto('/computers');
  }

  async searchComputers(query: string) {
    await this.searchInput.fill(query);
  }

  async filterByStatus(status: string) {
    await this.statusFilter.selectOption(status);
  }

  async switchToGridView() {
    await this.gridViewButton.click();
  }

  async switchToListView() {
    await this.listViewButton.click();
  }

  async clickComputer(computerName: string) {
    await this.page.locator(`[data-testid="computer-card"]:has-text("${computerName}")`).click();
  }

  async clickBookComputer(computerName: string) {
    const computerCard = this.page.locator(`[data-testid="computer-card"]:has-text("${computerName}")`);
    await computerCard.locator('button:has-text("Book")').click();
  }

  async clickCalendarView(computerName: string) {
    const computerCard = this.page.locator(`[data-testid="computer-card"]:has-text("${computerName}")`);
    await computerCard.locator('[data-testid="calendar-button"]').click();
  }

  // Assertions
  async expectComputersToBeVisible() {
    await expect(this.computerCards.first()).toBeVisible();
  }

  async expectComputerToBeVisible(computerName: string) {
    await expect(this.page.locator(`[data-testid="computer-card"]:has-text("${computerName}")`)).toBeVisible();
  }

  async expectComputerStatus(computerName: string, status: string) {
    const computerCard = this.page.locator(`[data-testid="computer-card"]:has-text("${computerName}")`);
    await expect(computerCard.locator(`[data-testid="status-chip"]:has-text("${status}")`)).toBeVisible();
  }

  async expectBookingDialogToBeOpen() {
    await expect(this.bookingDialog).toBeVisible();
  }

  async expectCalendarDialogToBeOpen() {
    await expect(this.calendarDialog).toBeVisible();
  }

  async expectSearchResults(computerName: string) {
    await expect(this.computerCards).toHaveCount(1);
    await expect(this.page.locator(`[data-testid="computer-card"]:has-text("${computerName}")`)).toBeVisible();
  }

  async expectFilteredResults(status: string, count?: number) {
    const computers = this.computerCards;
    if (count !== undefined) {
      await expect(computers).toHaveCount(count);
    }
    
    // Check that all visible computers have the expected status
    const computerCount = await computers.count();
    for (let i = 0; i < computerCount; i++) {
      const computer = computers.nth(i);
      await expect(computer.locator(`[data-testid="status-chip"]:has-text("${status}")`)).toBeVisible();
    }
  }
}
