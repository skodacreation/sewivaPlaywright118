import { Page } from 'playwright';
import { OrdinoSidePanel } from './panels/ordinoSidePanel';
import { oi } from '@ordino.ai/ordino-engine';

export class HomePage {

    page: Page;
    sidePanel: OrdinoSidePanel;

    private btn_profile = '.MuiAvatar-root';
    private btn_logout = '#logout-button111';
    private dashboardTitle = "//h4[normalize-space()='Dashboard']";

    constructor(page: Page) {
        this.page = page;
        this.sidePanel = new OrdinoSidePanel(this.page);
    }

    public step_searchOption() {
        this.sidePanel.step_searchOption();
        return this;
    }

     async step_logout() {
        await oi.ui(this.page).button(this.btn_profile).click(); 
        // Wait for dropdown menu to appear
        await this.page.waitForTimeout(500);      
        oi.ui(this.page).button(this.btn_logout).click();
        return this;
    }

    //verify Dashboard page title
    async step_verifyDashboardTitle(value:string) {
        await oi.ui(this.page).label(this.dashboardTitle).assertText(value);
        return this;
    }

} 