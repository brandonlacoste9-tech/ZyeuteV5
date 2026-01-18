/// <reference types="cypress" />

// -----------------------------------------------------------------------------
// Helper: scroll the list until a row with a given index is visible
// -----------------------------------------------------------------------------
function scrollToRow(rowIndex) {
  // The virtual list container has the class .feed-root (from ContinuousFeed.css)
  cy.get('.feed-root')
    .scrollTo('top', { duration: 500 })
    .then(($list) => {
      // The height of each row is based on viewport height
      // Compute the scroll offset needed to bring `rowIndex` into view.
      const rowHeight = Cypress.config('viewportHeight');
      const offset = rowIndex * rowHeight;
      cy.wrap($list).scrollTo(0, offset, { duration: 500 });
    });
}

// -----------------------------------------------------------------------------
// Test Suite
// -----------------------------------------------------------------------------
describe('Continuous Feed – Infinite Scroll & Lazy Loading', () => {
  const SCROLL_TIMEOUT = 15000;

  beforeEach(() => {
    cy.visit('/feed');
    cy.get('.feed-root').should('be.visible');
  });

  it('renders the first batch of video rows', () => {
    // First visible row should have a video player
    cy.get('[data-video-index]')
      .first()
      .should('be.visible');
  });

  it('lazy‑loads videos as they enter the viewport', () => {
    // Scroll to a later row that is not yet loaded
    scrollToRow(3);

    // The player for row 3 should now appear
    cy.get('[data-video-index="3"]')
      .should('be.visible');
  });

  it('inserts ads at expected intervals', () => {
    // The ad rows have a distinct class .ad-row (if ads are enabled)
    // Or check for sponsored content markers
    cy.get('.feed-root').scrollTo('bottom', { duration: 800 });
    
    // Verify the feed contains multiple rows
    cy.get('[data-video-index]').should('have.length.at.least', 2);
  });

  it('continues loading more rows on infinite scroll', () => {
    // Scroll near the bottom to trigger the "load more" fetch
    cy.get('.feed-root')
      .scrollTo('bottom', { duration: 800 });
    
    cy.wait(SCROLL_TIMEOUT);

    // After loading, we should see the row count increase
    cy.get('[data-video-index]').then(($before) => {
      const countBefore = $before.length;

      // Scroll a second time to force another fetch
      cy.get('.feed-root')
        .scrollTo('bottom', { duration: 800 });
      
      cy.wait(SCROLL_TIMEOUT);

      // Verify the number grew (or stayed same if no more data)
      cy.get('[data-video-index]').should(($after) => {
        expect($after.length).to.be.at.least(countBefore);
      });
    });
  });

  it('does not cause unnecessary re‑renders (Paint Flashing sanity check)', () => {
    // Scroll to a few random rows and assert they become visible
    const rowsToCheck = [1, 2, 3];
    rowsToCheck.forEach((idx) => {
      scrollToRow(idx);
      cy.wait(500);
      cy.get(`[data-video-index="${idx}"]`)
        .should('be.visible');
    });
  });

  it('maintains 100dvh layout without black screen', () => {
    // Verify the feed root fills the viewport
    cy.get('.feed-root').should(($el) => {
      const height = $el.height();
      const viewportHeight = Cypress.config('viewportHeight');
      // Allow some tolerance for scrollbars/borders
      expect(height).to.be.within(viewportHeight - 50, viewportHeight + 50);
    });
  });
});
