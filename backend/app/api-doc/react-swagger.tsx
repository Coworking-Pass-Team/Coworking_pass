"use client";

// @ts-expect-error swagger-ui-react ships no type declarations
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

type Props = {
  spec: Record<string, unknown>;
};

function ReactSwagger({ spec }: Props) {
  return (
    <div style={{ backgroundColor: "#ffffff", minHeight: "100vh" }}>
      <SwaggerUI spec={spec} />
    </div>
  );
}

export default ReactSwagger;