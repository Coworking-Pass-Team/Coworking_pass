import { createSwaggerSpec } from "next-swagger-doc";

export const getApiDocs = () => {
  return createSwaggerSpec({
    apiFolder: "app/api",
    autoDoc: true,
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Coworking Pass API",
        version: "1.0.0",
        description: "توثيق كامل لكل الـ APIs الخاصة بمشروع Coworking Pass",
      },
      components: {
        securitySchemes: {
          BearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
      security: [{ BearerAuth: [] }],
    },
  });
};