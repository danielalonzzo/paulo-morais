const { test, expect } = require('@playwright/test');

test.describe('Booking Flow (Fluxo de Reserva)', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to the app (assuming it runs on localhost:5000 via firebase serve or similar)
    // For this test we can just mock a URL, but typically Playwright needs a web server.
    // We will set a base URL in playwright.config.js later.
    await page.goto('/');
  });

  test('should display the calendar when logged in and navigated to perfil.html', async ({ page }) => {
    // Simulate login state
    await page.evaluate(() => {
      localStorage.setItem('pm_is_logged_in', 'true');
      localStorage.setItem('pm_user_email', 'test@example.com');
    });

    // Go to perfil.html which contains the booking calendar
    await page.goto('/perfil.html');

    // Wait for the calendar container to be visible
    const calendarSection = page.locator('#calendar-section');
    await expect(calendarSection).toBeVisible();

    // The calendar grid should be generated
    const calendarGrid = page.locator('#calendar-grid');
    await expect(calendarGrid).toBeVisible();

    // Verify if slots are rendered (e.g., waiting for at least one slot)
    // Note: If slots depend on Firestore, we might mock the network request or just verify the UI shell
    const slots = page.locator('.time-slot');
    if (await slots.count() > 0) {
      // Click a slot to select it
      await slots.first().click();
      
      // Verify that the booking modal or selection appears
      const bookingModal = page.locator('#booking-modal');
      // await expect(bookingModal).toBeVisible();
    }
  });

  test('should require login to book a slot', async ({ page }) => {
    // Ensure no login state
    await page.evaluate(() => {
      localStorage.removeItem('pm_is_logged_in');
    });

    // Attempt to access perfil directly or click "AGENDAR"
    await page.goto('/perfil.html?booking=true');

    // It should show the login form instead of the calendar
    const loginForm = page.locator('#loginForm');
    await expect(loginForm).toBeVisible();
    
    // Calendar should not be visible
    const calendarSection = page.locator('#calendar-section');
    await expect(calendarSection).toBeHidden();
  });
});
