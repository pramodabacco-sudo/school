// components/DocumentsInfo.jsx

import React from "react";
import { FileText } from "lucide-react";

import {
  SectionHeading,
  Loading,
  ErrorMsg,
  Empty,
  C,
} from "./shared.jsx";

export default function DocumentsInfo({
  docs,
  loading,
  error,
}) {
  if (loading) return <Loading />;
  if (error) return <ErrorMsg msg={error} />;

  if (!docs.length)
    return <Empty message="No documents uploaded." />;

  return (
    <div>
      <SectionHeading
        icon={FileText}
        title={`Documents (${docs.length})`}
      />

      <div className="pf-doc-grid">
        {docs.map((doc) => (
          <div
            key={doc.id}
            className="pf-info-card"
          >
            <div>
              <div
                style={{
                  fontWeight: 700,
                  color: C.dark,
                }}
              >
                {doc.documentType}
              </div>

              <div
                style={{
                  fontSize: 11,
                  color: C.mid,
                  marginTop: 3,
                }}
              >
                {doc.fileType}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}