import "@testing-library/jest-dom";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return "";
  },
}));

// Mock next-auth
jest.mock("next-auth", () => ({
  default: jest.fn(),
}));

jest.mock("next-auth/react", () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: "unauthenticated",
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }) => children,
}));

// Mock environment variables
process.env.NEXTAUTH_URL = "http://localhost:3000";
process.env.NEXTAUTH_SECRET = "test-secret";

// Mock crypto module for Node.js compatibility
Object.defineProperty(global, "crypto", {
  value: {
    getRandomValues: jest.fn().mockImplementation((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
    randomUUID: jest.fn().mockReturnValue("test-uuid"),
  },
});

// Mock fetch globally
global.fetch = jest.fn();

// Mock FileReader
global.FileReader = jest.fn(() => ({
  readAsDataURL: jest.fn(),
  readAsArrayBuffer: jest.fn(),
  readAsText: jest.fn(),
  onload: null,
  onerror: null,
  result: null,
}));

// Mock Image constructor
global.Image = jest.fn(() => ({
  onload: null,
  onerror: null,
  src: "",
  width: 0,
  height: 0,
}));

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn().mockReturnValue("mock-url");
global.URL.revokeObjectURL = jest.fn();
