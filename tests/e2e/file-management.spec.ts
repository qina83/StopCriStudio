import { test, expect } from '@playwright/test'

test.describe('File Management Epic (#18)', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before the app initialises to prevent recovery modal
    await page.addInitScript(() => localStorage.clear())
    await page.goto('/')
  })

  test.describe('US-1.1: Create New OpenAPI Specification', () => {
    test('should display Create New API button on landing screen', async ({ page }) => {
      const createButton = page.getByRole('button', { name: /create new api/i })
      await expect(createButton).toBeVisible()
    })

    test('should open form when Create New API button is clicked', async ({ page }) => {
      const createButton = page.getByRole('button', { name: /create new api/i })
      await createButton.click()

      const modal = page.getByText('Create New API Specification')
      await expect(modal).toBeVisible()
    })

    test('should have form fields with sensible defaults', async ({ page }) => {
      const createButton = page.getByRole('button', { name: /create new api/i })
      await createButton.click()

      const titleInput = page.getByLabel(/api title/i)
      const versionInput = page.getByLabel(/version/i)

      await expect(titleInput).toHaveValue('My API')
      await expect(versionInput).toHaveValue('1.0.0')
    })

    test('should create new spec and show editor when submitted', async ({ page }) => {
      const createButton = page.getByRole('button', { name: /create new api/i })
      await createButton.click()

      const titleInput = page.getByLabel(/api title/i)
      const submitButton = page.getByRole('button', { name: /^Create$/i }).last()

      await titleInput.fill('Test API')
      await submitButton.click()

      // Should be in editor view
      const exportButton = page.getByRole('button', { name: /export/i }).first()
      await expect(exportButton).toBeVisible()

      // Check title is displayed
      const title = page.getByRole('heading', { name: 'Test API' })
      await expect(title).toBeVisible()

      // Check success toast
      const successToast = page.getByText(/new specification created/i)
      await expect(successToast).toBeVisible()
    })

    test('should auto-save new spec to localStorage', async ({ page }) => {
      const createButton = page.getByRole('button', { name: /create new api/i })
      await createButton.click()

      const titleInput = page.getByLabel(/api title/i)
      const submitButton = page.getByRole('button', { name: /^Create$/i }).last()

      await titleInput.fill('Saved API')
      await submitButton.click()

      // Verify localStorage was saved
      const savedDraft = await page.evaluate(() => {
        return localStorage.getItem('openapi-spec-draft')
      })

      expect(savedDraft).toBeTruthy()
      const draft = JSON.parse(savedDraft!)
      expect(draft.info.title).toBe('Saved API')
    })

    test('should include description and base URL when provided', async ({ page }) => {
      const createButton = page.getByRole('button', { name: /create new api/i })
      await createButton.click()

      const titleInput = page.getByLabel(/api title/i)
      const descriptionInput = page.getByLabel(/description/i)
      const baseUrlInput = page.getByLabel(/base url/i)
      const submitButton = page.getByRole('button', { name: /^Create$/i }).last()

      await titleInput.fill('Full API')
      await descriptionInput.fill('A complete API specification')
      await baseUrlInput.fill('https://api.example.com')
      await submitButton.click()

      const description = page.getByText('A complete API specification', { exact: true })
      await expect(description).toBeVisible()
    })
  })

  test.describe('US-1.2: Upload Existing OpenAPI File', () => {
    test('should display Upload Existing File button on landing screen', async ({ page }) => {
      const uploadButton = page.getByRole('button', { name: /upload existing file/i })
      await expect(uploadButton).toBeVisible()
    })

    test('should open upload modal when button is clicked', async ({ page }) => {
      const uploadButton = page.getByRole('button', { name: /upload existing file/i })
      await uploadButton.click()

      const modal = page.getByText('Upload OpenAPI File')
      await expect(modal).toBeVisible()
    })

    test('should accept JSON files', async ({ page }) => {
      const uploadButton = page.getByRole('button', { name: /upload existing file/i })
      await uploadButton.click()

      const selectButton = page.getByRole('button', { name: /click to select/i })
      await expect(selectButton).toBeVisible()

      // Verify the file input accepts the right extensions
      const fileInput = page.locator('input[type="file"]')
      await expect(fileInput).toHaveAttribute('accept', '.json,.yaml,.yml')
    })

    test('should load valid OpenAPI file and show success', async ({ page }) => {
      const uploadButton = page.getByRole('button', { name: /upload existing file/i })
      await uploadButton.click()

      // Create a valid OpenAPI JSON file in memory
      const fileContent = JSON.stringify({
        openapi: '3.0.0',
        info: {
          title: 'Uploaded API',
          version: '1.0.0',
          description: 'Test uploaded spec',
        },
        paths: {},
      })

      // Create file input and upload
      const buffer = Buffer.from(fileContent)
      await page.setInputFiles('input[type="file"]', {
        name: 'api.json',
        mimeType: 'application/json',
        buffer: buffer,
      })

      // Wait for file processing
      await page.waitForTimeout(1000)

      // Should show success toast and switch to editor
      const exportButton = page.getByRole('button', { name: /export/i }).first()
      await expect(exportButton).toBeVisible()
    })
  })

  test.describe('US-1.3: Export Specification as JSON', () => {
    test('should show export button in editor', async ({ page }) => {
      // Create a spec first
      const createButton = page.getByRole('button', { name: /create new api/i })
      await createButton.click()

      const submitButton = page.getByRole('button', { name: /^Create$/i }).last()
      await submitButton.click()

      const exportButton = page.getByRole('button', { name: /export/i }).first()
      await expect(exportButton).toBeVisible()
    })

    test('should open export modal with format selection', async ({ page }) => {
      // Create a spec
      const createButton = page.getByRole('button', { name: /create new api/i })
      await createButton.click()

      const submitButton = page.getByRole('button', { name: /^Create$/i }).last()
      await submitButton.click()

      const exportButton = page.getByRole('button', { name: /export/i }).first()
      await exportButton.click()

      const modal = page.getByText('Export Specification')
      await expect(modal).toBeVisible()

      const jsonOption = page.getByLabel('JSON')
      await expect(jsonOption).toBeVisible()
    })

    test('should download JSON file when selected', async ({ page }) => {
      // Create a spec
      const createButton = page.getByRole('button', { name: /create new api/i })
      await createButton.click()

      const titleInput = page.getByLabel(/api title/i)
      const submitButton = page.getByRole('button', { name: /^Create$/i }).last()

      await titleInput.fill('Download Test')
      await submitButton.click()

      const exportButton = page.getByRole('button', { name: /export/i }).first()
      await exportButton.click()

      // Verify JSON is selected by default
      const jsonRadio = page.locator('input[type="radio"][value="json"]')
      await expect(jsonRadio).toBeChecked()

      // Listen for download
      const downloadPromise = page.waitForEvent('download')

      const downloadButton = page.getByRole('button', { name: /download/i })
      await downloadButton.click()

      const download = await downloadPromise
      expect(download.suggestedFilename()).toContain('.json')
    })
  })

  test.describe('US-1.4: Export Specification as YAML', () => {
    test('should allow selection of YAML format', async ({ page }) => {
      // Create a spec
      const createButton = page.getByRole('button', { name: /create new api/i })
      await createButton.click()

      const submitButton = page.getByRole('button', { name: /^Create$/i }).last()
      await submitButton.click()

      const exportButton = page.getByRole('button', { name: /export/i }).first()
      await exportButton.click()

      const yamlOption = page.getByLabel('YAML')
      await expect(yamlOption).toBeVisible()

      await yamlOption.click()

      const yamlRadio = page.locator('input[type="radio"][value="yaml"]')
      await expect(yamlRadio).toBeChecked()
    })

    test('should download YAML file when selected', async ({ page }) => {
      // Create a spec
      const createButton = page.getByRole('button', { name: /create new api/i })
      await createButton.click()

      const titleInput = page.getByLabel(/api title/i)
      const submitButton = page.getByRole('button', { name: /^Create$/i }).last()

      await titleInput.fill('YAML Test')
      await submitButton.click()

      const exportButton = page.getByRole('button', { name: /export/i }).first()
      await exportButton.click()

      // Select YAML
      const yamlOption = page.getByLabel('YAML')
      await yamlOption.click()

      // Listen for download
      const downloadPromise = page.waitForEvent('download')

      const downloadButton = page.getByRole('button', { name: /download/i })
      await downloadButton.click()

      const download = await downloadPromise
      expect(download.suggestedFilename()).toContain('.yaml')
    })
  })

  test.describe('US-1.5: Copy Specification to Clipboard', () => {
    test('should show copy to clipboard button in export modal', async ({ page }) => {
      // Create a spec
      const createButton = page.getByRole('button', { name: /create new api/i })
      await createButton.click()

      const submitButton = page.getByRole('button', { name: /^Create$/i }).last()
      await submitButton.click()

      const exportButton = page.getByRole('button', { name: /export/i }).first()
      await exportButton.click()

      const copyButton = page.getByRole('button', { name: /copy to clipboard/i })
      await expect(copyButton).toBeVisible()
    })

    test('should copy JSON to clipboard and show success', async ({ page }) => {
      // Create a spec
      const createButton = page.getByRole('button', { name: /create new api/i })
      await createButton.click()

      const titleInput = page.getByLabel(/api title/i)
      const submitButton = page.getByRole('button', { name: /^Create$/i }).last()

      await titleInput.fill('Clipboard Test')
      await submitButton.click()

      const exportButton = page.getByRole('button', { name: /export/i }).first()
      await exportButton.click()

      // Ensure JSON is selected
      const jsonRadio = page.locator('input[type="radio"][value="json"]')
      await jsonRadio.check()

      const copyButton = page.getByRole('button', { name: /copy to clipboard/i })
      await copyButton.click()

      // Check for success message
      const successMessage = page.getByText(/copied/i)
      await expect(successMessage).toBeVisible()
    })

    test('should copy YAML to clipboard', async ({ page }) => {
      // Create a spec
      const createButton = page.getByRole('button', { name: /create new api/i })
      await createButton.click()

      const titleInput = page.getByLabel(/api title/i)
      const submitButton = page.getByRole('button', { name: /^Create$/i }).last()

      await titleInput.fill('YAML Clipboard Test')
      await submitButton.click()

      const exportButton = page.getByRole('button', { name: /export/i }).first()
      await exportButton.click()

      // Select YAML
      const yamlRadio = page.locator('input[type="radio"][value="yaml"]')
      await yamlRadio.check()

      const copyButton = page.getByRole('button', { name: /copy to clipboard/i })
      await copyButton.click()

      // Check for success message
      const successMessage = page.getByText(/copied/i)
      await expect(successMessage).toBeVisible()
    })
  })

  test.describe('US-1.6: Auto-Save Draft to Browser Storage', () => {
    test('should auto-save changes to localStorage every 30 seconds', async ({ page }) => {
      // Create a spec
      const createButton = page.getByRole('button', { name: /create new api/i })
      await createButton.click()

      const titleInput = page.getByLabel(/api title/i)
      const submitButton = page.getByRole('button', { name: /^Create$/i }).last()

      await titleInput.fill('Auto-Save Test')
      await submitButton.click()

      // Get initial saved draft
      const initialDraft = await page.evaluate(() => {
        return localStorage.getItem('openapi-spec-draft')
      })

      expect(initialDraft).toBeTruthy()

      // Interact with the textarea to mark spec as modified
      const textarea = page.locator('textarea')
      await textarea.click()
      await textarea.press('End')
      await page.keyboard.type(' ')

      // Check that "Unsaved changes" indicator is visible after modification
      const unsavedIndicator = page.getByText(/unsaved changes/i)
      await expect(unsavedIndicator).toBeVisible()
    })

    test('should show Last saved time after save', async ({ page }) => {
      // Create a spec
      const createButton = page.getByRole('button', { name: /create new api/i })
      await createButton.click()

      const submitButton = page.getByRole('button', { name: /^Create$/i }).last()
      await submitButton.click()

      // Should show last saved time
      const lastSavedText = page.getByText(/last saved/i)
      await expect(lastSavedText).toBeVisible()
    })
  })

  test.describe('US-1.7: Recover Unsaved Draft', () => {
    const draftSpec = JSON.stringify({
      openapi: '3.0.0',
      info: { title: 'Draft Recovery Test', version: '1.0.0' },
      paths: {},
    })

    function buildPageWithDraft(context: import('@playwright/test').BrowserContext) {
      return context.newPage().then(async (freshPage) => {
        await freshPage.addInitScript((spec) => {
          localStorage.setItem('openapi-spec-draft', spec)
          localStorage.setItem('openapi-spec-draft-timestamp', String(Date.now() - 60000))
        }, draftSpec)
        return freshPage
      })
    }

    test('should show recovery modal when draft exists on app load', async ({ context }) => {
      const freshPage = await buildPageWithDraft(context)
      await freshPage.goto('/')

      const recoveryModal = freshPage.getByText(/recover unsaved draft/i)
      await expect(recoveryModal).toBeVisible()
      await freshPage.close()
    })

    test('should show date/time of draft in recovery modal', async ({ context }) => {
      const freshPage = await buildPageWithDraft(context)
      await freshPage.goto('/')

      // Modal content includes the draft time
      const modalText = freshPage.getByText(/we found an unsaved draft/i)
      await expect(modalText).toBeVisible()
      await freshPage.close()
    })

    test('should load draft when Load Draft button is clicked', async ({ context }) => {
      const freshPage = await buildPageWithDraft(context)
      await freshPage.goto('/')

      const loadButton = freshPage.getByRole('button', { name: /load draft/i })
      await loadButton.click()

      // Should show the editor with the loaded spec
      const title = freshPage.getByRole('heading', { name: 'Draft Recovery Test' })
      await expect(title).toBeVisible()
      await freshPage.close()
    })

    test('should discard draft when Discard button is clicked', async ({ context }) => {
      const freshPage = await buildPageWithDraft(context)
      await freshPage.goto('/')

      const discardButton = freshPage.getByRole('button', { name: /discard/i })
      await discardButton.click()

      // Should return to landing page
      const createButton = freshPage.getByRole('button', { name: /create new api/i })
      await expect(createButton).toBeVisible()

      // Draft should be cleared from storage
      const draft = await freshPage.evaluate(() => localStorage.getItem('openapi-spec-draft'))
      expect(draft).toBeNull()
      await freshPage.close()
    })

    test('should clear draft from storage when discarded', async ({ context }) => {
      const freshPage = await buildPageWithDraft(context)
      await freshPage.goto('/')

      // Verify draft is in storage on fresh page
      let draft = await freshPage.evaluate(() => localStorage.getItem('openapi-spec-draft'))
      expect(draft).toBeTruthy()

      const discardButton = freshPage.getByRole('button', { name: /discard/i })
      await discardButton.click()

      // Verify storage is cleared
      draft = await freshPage.evaluate(() => localStorage.getItem('openapi-spec-draft'))
      expect(draft).toBeNull()
      await freshPage.close()
    })
  })

  test.describe('Integration Tests', () => {
    test('should complete full workflow: create -> edit -> export -> recover', async ({
      page,
      context,
    }) => {
      // 1. Create new spec
      const createButton = page.getByRole('button', { name: /create new api/i })
      await createButton.click()

      const titleInput = page.getByLabel(/api title/i)
      const submitButton = page.getByRole('button', { name: /^Create$/i }).last()

      await titleInput.fill('Integration Test API')
      await submitButton.click()

      // 2. Verify in editor
      const exportButton = page.getByRole('button', { name: /export/i }).first()
      await expect(exportButton).toBeVisible()

      // 3. Export as JSON
      await exportButton.click()

      const downloadPromise = page.waitForEvent('download')
      const downloadButton = page.getByRole('button', { name: /download/i })
      await downloadButton.click()

      const download = await downloadPromise
      expect(download.suggestedFilename()).toContain('.json')

      // 4. Read the saved draft from this page's localStorage
      const savedDraft = await page.evaluate(() => localStorage.getItem('openapi-spec-draft'))
      expect(savedDraft).toBeTruthy()

      // 5. Recover draft in a fresh page (simulates reloading the browser)
      const freshPage = await context.newPage()
      await freshPage.addInitScript((draft) => {
        localStorage.setItem('openapi-spec-draft', draft!)
        localStorage.setItem('openapi-spec-draft-timestamp', String(Date.now() - 1000))
      }, savedDraft)
      await freshPage.goto('/')

      const loadButton = freshPage.getByRole('button', { name: /load draft/i })
      await loadButton.click()

      const title = freshPage.getByRole('heading', { name: 'Integration Test API' })
      await expect(title).toBeVisible()
      await freshPage.close()
    })
  })
})
