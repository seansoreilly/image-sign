import { readFileSync } from 'fs'
import { join } from 'path'

const TEST_EMAIL = 'test@gmail.com'
const TEST_IMAGES_DIR = join(__dirname, 'images')

// Helper to read test image file
const readTestImage = (filename: string): File => {
  const filePath = join(TEST_IMAGES_DIR, filename)
  const buffer = readFileSync(filePath)
  const file = new File([buffer], filename, { 
    type: getContentType(filename)
  })
  return file
}

// Helper to get content type based on file extension
const getContentType = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'gif':
      return 'image/gif'
    case 'webp':
      return 'image/webp'
    default:
      return 'application/octet-stream'
  }
}

// Helper to call sign API
const signImage = async (file: File, email: string) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('email', email)

  const response = await fetch('/api/sign', {
    method: 'POST',
    body: formData,
  })

  return response
}

// Helper to call verify API
const verifyImage = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('/api/verify', {
    method: 'POST',
    body: formData,
  })

  return response
}

describe('Image Signing Integration Tests', () => {
  const testImages = [
    'sample_jpg.jpg',
    'sample_png.png',
    'sample_gif.gif',
    'sample_webp.webp'
  ]

  // Mock fetch for testing
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  testImages.forEach(filename => {
    describe(`${filename} format`, () => {
      let originalFile: File
      let signedFile: File

      beforeAll(() => {
        originalFile = readTestImage(filename)
      })

      it(`should successfully sign ${filename} with email ${TEST_EMAIL}`, async () => {
        // Mock successful sign response
        const mockSignedBuffer = new ArrayBuffer(originalFile.size + 1000) // Simulate larger signed file
        const mockResponse = {
          ok: true,
          status: 200,
          arrayBuffer: () => Promise.resolve(mockSignedBuffer),
          json: () => Promise.resolve({
            success: true,
            message: 'Image signed successfully',
            signedBy: TEST_EMAIL
          })
        }

        ;(global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

        const response = await signImage(originalFile, TEST_EMAIL)
        const data = await response.json()

        expect(response.ok).toBe(true)
        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.signedBy).toBe(TEST_EMAIL)

        // Create signed file for verification test
        const signedBuffer = await response.arrayBuffer()
        signedFile = new File([signedBuffer], filename, {
          type: getContentType(filename)
        })

        expect(signedFile.size).toBeGreaterThan(originalFile.size)
      })

      it(`should successfully verify signed ${filename}`, async () => {
        // Ensure we have a signed file from previous test
        if (!signedFile) {
          const mockSignedBuffer = new ArrayBuffer(originalFile.size + 1000)
          signedFile = new File([mockSignedBuffer], filename, {
            type: getContentType(filename)
          })
        }

        // Mock successful verify response
        const mockResponse = {
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            success: true,
            verified: true,
            signedBy: TEST_EMAIL,
            signedAt: new Date().toISOString(),
            message: 'Image signature verified successfully'
          })
        }

        ;(global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

        const response = await verifyImage(signedFile)
        const data = await response.json()

        expect(response.ok).toBe(true)
        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.verified).toBe(true)
        expect(data.signedBy).toBe(TEST_EMAIL)
        expect(data.signedAt).toBeDefined()
      })

      it(`should detect unsigned ${filename} during verification`, async () => {
        // Mock response for unsigned image
        const mockResponse = {
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            success: true,
            verified: false,
            message: 'No signature found in image'
          })
        }

        ;(global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

        const response = await verifyImage(originalFile)
        const data = await response.json()

        expect(response.ok).toBe(true)
        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.verified).toBe(false)
        expect(data.message).toContain('No signature found')
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle sign API errors gracefully', async () => {
      const file = readTestImage('sample_jpg.jpg')
      
      const mockResponse = {
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          success: false,
          error: 'Invalid file format'
        })
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

      const response = await signImage(file, TEST_EMAIL)
      const data = await response.json()

      expect(response.ok).toBe(false)
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBeDefined()
    })

    it('should handle verify API errors gracefully', async () => {
      const file = readTestImage('sample_jpg.jpg')
      
      const mockResponse = {
        ok: false,
        status: 500,
        json: () => Promise.resolve({
          success: false,
          error: 'Internal server error'
        })
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

      const response = await verifyImage(file)
      const data = await response.json()

      expect(response.ok).toBe(false)
      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBeDefined()
    })

    it('should handle network errors', async () => {
      const file = readTestImage('sample_jpg.jpg')
      
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      await expect(signImage(file, TEST_EMAIL)).rejects.toThrow('Network error')
    })
  })
}) 