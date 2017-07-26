import { Grafterizer.2.0Page } from './app.po';

describe('grafterizer.2.0 App', () => {
  let page: Grafterizer.2.0Page;

  beforeEach(() => {
    page = new Grafterizer.2.0Page();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!!');
  });
});
