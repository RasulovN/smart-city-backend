// utils/swagger.js
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

// Recursively find all YAML files in docs directory
function findYamlFiles(dir, fileList = []) {
  try {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        findYamlFiles(filePath, fileList);
      } else if (file.endsWith('.yaml') || file.endsWith('.yml')) {
        fileList.push(filePath);
      }
    });
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }
  
  return fileList;
}

// Load and merge YAML files
function loadYamlSpecs(docsPath) {
  const yamlFiles = findYamlFiles(docsPath);
  const specs = [];
  
  yamlFiles.forEach(filePath => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const doc = yaml.load(content);
      if (doc && typeof doc === 'object') {
        specs.push(doc);
        console.log(`Loaded YAML spec: ${path.basename(filePath)}`);
      }
    } catch (error) {
      console.error(`Error loading YAML file ${filePath}:`, error.message);
    }
  });
  
  return specs;
}

// Merge multiple OpenAPI specs
function mergeSpecs(specs) {
  if (specs.length === 0) {
    return {
      openapi: "3.0.3",
      info: {
        title: "Smart City API",
        version: "1.0.0",
        description: "Smart City loyihasi uchun toʻliq backend API hujjatlari"
      }
    };
  }
  
  // Start with the first spec as base
  const merged = JSON.parse(JSON.stringify(specs[0]));
  
  // Merge additional specs
  for (let i = 1; i < specs.length; i++) {
    const spec = specs[i];
    
    // Merge paths
    if (spec.paths) {
      merged.paths = { ...merged.paths, ...spec.paths };
    }
    
    // Merge components
    if (spec.components) {
      merged.components = merged.components || {};
      
      // Merge schemas
      if (spec.components.schemas) {
        merged.components.schemas = { 
          ...merged.components.schemas, 
          ...spec.components.schemas 
        };
      }
      
      // Merge securitySchemes
      if (spec.components.securitySchemes) {
        merged.components.securitySchemes = { 
          ...merged.components.securitySchemes, 
          ...spec.components.securitySchemes 
        };
      }
      
      // Merge responses
      if (spec.components.responses) {
        merged.components.responses = { 
          ...merged.components.responses, 
          ...spec.components.responses 
        };
      }
      
      // Merge parameters
      if (spec.components.parameters) {
        merged.components.parameters = { 
          ...merged.components.parameters, 
          ...spec.components.parameters 
        };
      }
    }
    
    // Merge tags (avoid duplicates)
    if (spec.tags) {
      const existingTagNames = (merged.tags || []).map(tag => tag.name);
      const newTags = spec.tags.filter(tag => !existingTagNames.includes(tag.name));
      merged.tags = [...(merged.tags || []), ...newTags];
    }
  }
  
  return merged;
}

// Swagger definition
const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Smart City API",
      version: "1.0.0",
      description: "Smart City loyihasi uchun toʻliq backend API hujjatlari. Admin panel, murojaatlar, sektorlar, tashkilotlar va boshqa modullar.",
      contact: {
        name: "Smart City Dev Team",
        url: "https://github.com/your-org/smart-city-backend",
        email: "dev@smartcity.uz",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: "http://localhost:4000/api",
        description: "Development server",
      },
      {
        url: "https://api.smart-city-qarshi.uz/api",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT tokenni kiriting: Bearer <token>",
        },
      },
      schemas: {
        // Common schemas that can be referenced across all modules
        User: {
          type: "object",
          properties: {
            _id: { type: "string", example: "64a1b2c3d4e5f6789abcdef" },
            fullName: { type: "string", example: "Ali Valiyev" },
            email: { type: "string", format: "email" },
            role: {
              type: "string",
              enum: ["super_admin", "admin", "sector_admin", "user"],
            },
            sector: {
              type: "string",
              enum: ["ecology", "infrastructure", "transport", "health", "education", "social", "economic", "other", "security"],
              nullable: true,
            },
            isActive: { type: "boolean", default: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        ApiResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string" },
            data: { type: "object", nullable: true },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string" },
            error: { type: "string", nullable: true },
          },
        },
      },
    },
    tags: [
      // { name: "Auth", description: "Foydalanuvchi autentifikatsiyasi" },
      { name: "Admin", description: "Admin panel operatsiyalari" },
      { name: "Users", description: "Foydalanuvchilarni boshqarish" },
      { name: "Sectors", description: "Sektorlar (yo'nalishlar)" },
      { name: "Companies", description: "Tashkilotlar va korxonalar" },
      { name: "Appeals", description: "Fuqarolar murojaatlari" },
    ],
    // Global security (faqat auth kerak bo'lmagan endpointlar override qiladi)
    security: [{ bearerAuth: [] }],
  },
  // Only load YAML files, no JSDoc from route files
  apis: [
    "./routes/**/*.js",
    "./docs/**/*.yaml",
    "./docs/**/*.yml",
  ],
};

// Generate swagger specification
const specs = swaggerJsdoc(options);

// Load and merge additional YAML specifications
const docsPath = path.join(__dirname, '../docs');
const additionalSpecs = loadYamlSpecs(docsPath);
const mergedSpecs = mergeSpecs([specs, ...additionalSpecs]);

// Swagger UI configuration
const swaggerUiOptions = {
  customCss: `
    .swagger-ui .topbar { 
      background: linear-gradient(90deg, #2563eb, #3b82f6);
      padding: 15px;
    }
    .swagger-ui .topbar .download-url-wrapper { display: none }
    .swagger-ui .info { margin: 30px 0; }
    .swagger-ui .scheme-container { background: #1f2937; padding: 15px; border-radius: 8px; }
  `,
  customSiteTitle: "Smart City API Docs",
  customfavIcon: "/favicon.ico",
  swaggerOptions: {
    persistAuthorization: true,
    docExpansion: "list",
    filter: true,
    showExtensions: true,
  },
};

module.exports = (app) => {
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(mergedSpecs, swaggerUiOptions)
  );

  // JSON formatda ham olish uchun (Postman, frontend)
  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(mergedSpecs);
  });

  console.log("Swagger docs: http://localhost:4000/api-docs");
};