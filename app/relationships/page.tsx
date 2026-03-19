"use client";

import { useEffect, useState } from "react";
import { APIRequestError } from "@/services/api";
import { 
  createManualRelationship, 
  createForeignKeyRelationship,
  getRelationshipHierarchy,
  getTableRelationships,
} from "@/services/relationshipService";
import { 
  NODE_LABELS, 
  RELATIONSHIP_TYPES,
  FK_RELATIONSHIP_TYPES,
  type FKRelationshipType,
  type RelationshipHierarchyDatabase,
  type RelationshipHierarchySchema,
  type RelationshipHierarchyTable,
  type RelationshipHierarchyColumn,
  type TableRelationshipItem,
} from "@/types/api";

type TabType = "fk" | "manual";

interface HierarchyState {
  databases: RelationshipHierarchyDatabase[];
  isLoading: boolean;
  error: string | null;
}

export default function RelationshipsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("fk");

  // Hierarchy State
  const [hierarchy, setHierarchy] = useState<HierarchyState>({
    databases: [],
    isLoading: true,
    error: null,
  });

  // PK Hierarchy State
  const [pkDatabase, setPkDatabase] = useState("");
  const [pkSchema, setPkSchema] = useState("");
  const [pkTable, setPkTable] = useState("");
  const [pkColumn, setPkColumn] = useState("");

  // FK Hierarchy State
  const [fkDatabase, setFkDatabase] = useState("");
  const [fkSchema, setFkSchema] = useState("");
  const [fkTable, setFkTable] = useState("");
  const [fkColumn, setFkColumn] = useState("");

  // Relationship Type
  const [fkRelationshipType, setFkRelationshipType] = useState<FKRelationshipType>("One-to-Many");

  // Manual Relationship State
  const [sourceLabel, setSourceLabel] = useState("Table");
  const [sourceName, setSourceName] = useState("");
  const [targetLabel, setTargetLabel] = useState("Table");
  const [targetName, setTargetName] = useState("");
  const [relation, setRelation] = useState("REFERENCES");

  // UI State
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // PK Relationships Panel State
  const [pkRelationships, setPkRelationships] = useState<TableRelationshipItem[]>([]);
  const [isLoadingPkRelationships, setIsLoadingPkRelationships] = useState(false);
  const [pkRelationshipsError, setPkRelationshipsError] = useState<string | null>(null);

  // Load hierarchy on mount
  useEffect(() => {
    const loadHierarchy = async () => {
      try {
        const data = await getRelationshipHierarchy();
        setHierarchy({
          databases: data.databases,
          isLoading: false,
          error: null,
        });
        
        // Auto-select first database
        if (data.databases.length > 0) {
          setPkDatabase(data.databases[0].id);
          setFkDatabase(data.databases[0].id);
        }
      } catch (err) {
        const errorMsg = err instanceof APIRequestError 
          ? (typeof err.detail === "string" ? err.detail : "Failed to load hierarchy")
          : "Failed to load hierarchy";
        setHierarchy({
          databases: [],
          isLoading: false,
          error: errorMsg,
        });
      }
    };

    loadHierarchy();
  }, []);

  // Helper functions to find items in hierarchy
  const getPkSchemas = (): RelationshipHierarchySchema[] => {
    const db = hierarchy.databases.find(d => d.id === pkDatabase);
    return db?.schemas || [];
  };

  const getPkTables = (): RelationshipHierarchyTable[] => {
    const db = hierarchy.databases.find(d => d.id === pkDatabase);
    const schema = db?.schemas.find(s => s.id === pkSchema);
    return schema?.tables || [];
  };

  const getPkColumns = (): RelationshipHierarchyColumn[] => {
    const table = getPkTables().find(t => t.id === pkTable);
    return table?.columns || [];
  };

  const getFkSchemas = (): RelationshipHierarchySchema[] => {
    const db = hierarchy.databases.find(d => d.id === fkDatabase);
    return db?.schemas || [];
  };

  const getFkTables = (): RelationshipHierarchyTable[] => {
    const db = hierarchy.databases.find(d => d.id === fkDatabase);
    const schema = db?.schemas.find(s => s.id === fkSchema);
    return schema?.tables || [];
  };

  const getFkColumns = (): RelationshipHierarchyColumn[] => {
    const table = getFkTables().find(t => t.id === fkTable);
    return table?.columns || [];
  };

  // Handle PK Database change
  const handlePkDatabaseChange = (newDatabase: string) => {
    setPkDatabase(newDatabase);
    setPkSchema(""); // Reset cascade
    setPkTable("");
    setPkColumn("");
  };

  // Handle PK Schema change
  const handlePkSchemaChange = (newSchema: string) => {
    setPkSchema(newSchema);
    setPkTable(""); // Reset cascade
    setPkColumn("");
  };

  // Handle PK Table change
  const handlePkTableChange = (newTable: string) => {
    setPkTable(newTable);
    setPkColumn("");
    setPkRelationships([]);
    setPkRelationshipsError(null);
    if (newTable) {
      const dbObj = hierarchy.databases.find((d) => d.id === pkDatabase);
      const schemaObj = dbObj?.schemas.find((s) => s.id === pkSchema);
      const dbName = dbObj?.name ?? pkDatabase;
      const schemaName = schemaObj?.name ?? pkSchema;
      setIsLoadingPkRelationships(true);
      getTableRelationships(newTable, schemaName, dbName)
        .then((data) => setPkRelationships(data.relationships))
        .catch((err) => {
          // 404 means the table has no relationships yet — treat as empty, not an error
          if (err instanceof APIRequestError && err.statusCode === 404) {
            setPkRelationships([]);
            return;
          }
          const msg = err instanceof APIRequestError
            ? (typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail))
            : (err instanceof Error ? err.message : "Could not load existing relationships");
          setPkRelationshipsError(msg);
        })
        .finally(() => setIsLoadingPkRelationships(false));
    }
  };

  // Handle FK Database change
  const handleFkDatabaseChange = (newDatabase: string) => {
    setFkDatabase(newDatabase);
    setFkSchema(""); // Reset cascade
    setFkTable("");
    setFkColumn("");
  };

  // Handle FK Schema change
  const handleFkSchemaChange = (newSchema: string) => {
    setFkSchema(newSchema);
    setFkTable(""); // Reset cascade
    setFkColumn("");
  };

  // Handle FK Table change
  const handleFkTableChange = (newTable: string) => {
    setFkTable(newTable);
    setFkColumn(""); // Reset column
  };

  const submitFkRelationship = async () => {
    setIsSubmitting(true);
    setMessage("");
    setError("");
    try {
      const response = await createForeignKeyRelationship({
        pk_table_name: pkTable,
        pk_column_name: pkColumn,
        fk_table_name: fkTable,
        fk_column_name: fkColumn,
        relationship_type: fkRelationshipType,
      });
      setMessage(response.message);
      // Reset form on success
      setPkDatabase(hierarchy.databases[0]?.id || "");
      setPkSchema("");
      setPkTable("");
      setPkColumn("");
      setFkDatabase(hierarchy.databases[0]?.id || "");
      setFkSchema("");
      setFkTable("");
      setFkColumn("");
      setFkRelationshipType("One-to-Many");
    } catch (err) {
      if (err instanceof APIRequestError) {
        setError(
          typeof err.detail === "string"
            ? err.detail
            : JSON.stringify(err.detail, null, 2),
        );
      } else {
        setError("Foreign key relationship creation failed.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitManualRelationship = async () => {
    setIsSubmitting(true);
    setMessage("");
    setError("");
    try {
      const response = await createManualRelationship({
        source_label: sourceLabel,
        source_name: sourceName.trim(),
        target_label: targetLabel,
        target_name: targetName.trim(),
        relation,
      });
      setMessage(response.message);
      setSourceName("");
      setTargetName("");
    } catch (err) {
      if (err instanceof APIRequestError) {
        setError(
          typeof err.detail === "string"
            ? err.detail
            : JSON.stringify(err.detail, null, 2),
        );
      } else {
        setError("Relationship creation failed.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCardinality = (cardinality: string | null): string => {
    if (cardinality === "One-to-Many") return "1:M";
    if (cardinality === "One-to-One") return "1:1";
    if (cardinality === "Many-to-Many") return "M:N";
    return "—";
  };

  const formatColumns = (item: TableRelationshipItem): string => {
    if (item.pk_column && item.fk_column) return `${item.pk_column} ← ${item.fk_column}`;
    return "—";
  };

  const fkFormValid = pkColumn && fkColumn && fkTable !== pkTable;
  const manualFormValid = sourceName.trim() && targetName.trim();

  if (hierarchy.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-950 mb-4"></div>
          <p className="text-blue-950 font-medium">Loading hierarchy...</p>
        </div>
      </div>
    );
  }

  if (hierarchy.error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="alert-error p-6 rounded-lg">
            <p className="text-sm font-medium text-red-800">
              Failed to load hierarchy: {hierarchy.error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (hierarchy.databases.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="alert-error p-6 rounded-lg">
            <p className="text-sm font-medium text-red-800">
              No tables found in knowledge graph. Please onboard data first.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-4xl text-blue-950 mb-2">
            Graph Relationship Manager
          </h1>
          <p className="text-base text-blue-900/75">
            Define primary key-foreign key relationships with hierarchical table selection
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-4 border-b border-blue-200">
          <button
            className={`py-3 px-4 font-medium transition-colors ${
              activeTab === "fk"
                ? "text-blue-950 border-b-2 border-blue-950"
                : "text-blue-900/60 hover:text-blue-900"
            }`}
            onClick={() => setActiveTab("fk")}
            type="button"
          >
            Foreign Key Relationships
          </button>
          <button
            className={`py-3 px-4 font-medium transition-colors ${
              activeTab === "manual"
                ? "text-blue-950 border-b-2 border-blue-950"
                : "text-blue-900/60 hover:text-blue-900"
            }`}
            onClick={() => setActiveTab("manual")}
            type="button"
          >
            Custom Relationships
          </button>
        </div>

        {/* FK Relationship Form */}
        {activeTab === "fk" && (
          <div className="surface max-w-5xl p-8">
            <h2 className="font-display text-2xl text-blue-950 mb-6">
              Create Foreign Key Relationship
            </h2>
            <p className="text-sm text-blue-900/75 mb-6">
              Navigate the hierarchy to select primary and foreign key columns.
            </p>

            <div className="grid gap-8">
              {/* Primary Key Section */}
              <div className="border border-blue-200 rounded-lg p-6 bg-blue-50/50">
                <h3 className="font-semibold text-blue-950 mb-4">Primary Key Table</h3>
                <div className="grid gap-4 md:grid-cols-4">
                  {/* PK Database */}
                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-2">
                      Database
                    </label>
                    <select
                      className="select-field"
                      onChange={(e) => handlePkDatabaseChange(e.target.value)}
                      value={pkDatabase}
                      disabled={isSubmitting}
                    >
                      <option value="">Select database...</option>
                      {hierarchy.databases.map((db) => (
                        <option key={db.id} value={db.id}>
                          {db.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* PK Schema */}
                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-2">
                      Schema
                    </label>
                    <select
                      className="select-field"
                      onChange={(e) => handlePkSchemaChange(e.target.value)}
                      value={pkSchema}
                      disabled={!pkDatabase || isSubmitting}
                    >
                      <option value="">Select schema...</option>
                      {getPkSchemas().map((schema) => (
                        <option key={schema.id} value={schema.id}>
                          {schema.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* PK Table */}
                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-2">
                      Table
                    </label>
                    <select
                      className="select-field"
                      onChange={(e) => handlePkTableChange(e.target.value)}
                      value={pkTable}
                      disabled={!pkSchema || isSubmitting}
                    >
                      <option value="">Select table...</option>
                      {getPkTables().map((table) => (
                        <option key={table.id} value={table.id}>
                          {table.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* PK Column */}
                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-2">
                      Primary Key Column
                    </label>
                    <select
                      className="select-field"
                      onChange={(e) => setPkColumn(e.target.value)}
                      value={pkColumn}
                      disabled={!pkTable || isSubmitting}
                    >
                      <option value="">Select column...</option>
                      {getPkColumns().map((column) => (
                        <option key={column.id} value={column.id}>
                          {column.name} {column.data_type ? `(${column.data_type})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* PK Relationships Panel */}
              {pkTable && (
                <div className="border border-blue-200 rounded-lg bg-white overflow-hidden">
                  <div className="flex items-center justify-between px-6 py-3 bg-blue-50 border-b border-blue-200">
                    <h3 className="font-semibold text-blue-950 text-sm">
                      Existing Relationships — <span className="font-mono">{pkTable}</span>
                    </h3>
                    {isLoadingPkRelationships && (
                      <span className="text-xs text-blue-700 flex items-center gap-1.5">
                        <span className="inline-block animate-spin h-3 w-3 border border-blue-700 border-t-transparent rounded-full" />
                        Loading...
                      </span>
                    )}
                  </div>

                  {pkRelationshipsError ? (
                    <p className="px-6 py-4 text-sm text-amber-700">{pkRelationshipsError}</p>
                  ) : !isLoadingPkRelationships && pkRelationships.length === 0 ? (
                    <p className="px-6 py-4 text-sm text-blue-900/50">No existing relationships for this table.</p>
                  ) : pkRelationships.length > 0 ? (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-blue-100">
                          <th className="px-6 py-2 text-left text-xs font-medium text-blue-900/60 uppercase tracking-wide">Direction</th>
                          <th className="px-6 py-2 text-left text-xs font-medium text-blue-900/60 uppercase tracking-wide">Type</th>
                          <th className="px-6 py-2 text-left text-xs font-medium text-blue-900/60 uppercase tracking-wide">Related Table</th>
                          <th className="px-6 py-2 text-left text-xs font-medium text-blue-900/60 uppercase tracking-wide">Columns</th>
                          <th className="px-6 py-2 text-left text-xs font-medium text-blue-900/60 uppercase tracking-wide">Cardinality</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pkRelationships.map((rel, idx) => (
                          <tr key={idx} className="border-b border-blue-50 last:border-0 hover:bg-blue-50/40 transition-colors">
                            <td className="px-6 py-3">
                              {rel.direction === "incoming" ? (
                                <span className="inline-flex items-center gap-1 text-indigo-700 font-medium text-xs">
                                  ← incoming
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-blue-700 font-medium text-xs">
                                  → outgoing
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-3">
                              <span className="font-mono text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                {rel.relationship_type}
                              </span>
                            </td>
                            <td className="px-6 py-3 font-medium text-blue-950 text-xs">{rel.related_table}</td>
                            <td className="px-6 py-3 font-mono text-xs text-blue-900/70">{formatColumns(rel)}</td>
                            <td className="px-6 py-3 text-xs text-blue-900/70">{formatCardinality(rel.cardinality)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : null}
                </div>
              )}

              {/* Foreign Key Section */}
              <div className="border border-blue-200 rounded-lg p-6 bg-blue-50/50">
                <h3 className="font-semibold text-blue-950 mb-4">Foreign Key Table</h3>
                <div className="grid gap-4 md:grid-cols-4">
                  {/* FK Database */}
                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-2">
                      Database
                    </label>
                    <select
                      className="select-field"
                      onChange={(e) => handleFkDatabaseChange(e.target.value)}
                      value={fkDatabase}
                      disabled={isSubmitting}
                    >
                      <option value="">Select database...</option>
                      {hierarchy.databases.map((db) => (
                        <option key={db.id} value={db.id}>
                          {db.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* FK Schema */}
                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-2">
                      Schema
                    </label>
                    <select
                      className="select-field"
                      onChange={(e) => handleFkSchemaChange(e.target.value)}
                      value={fkSchema}
                      disabled={!fkDatabase || isSubmitting}
                    >
                      <option value="">Select schema...</option>
                      {getFkSchemas().map((schema) => (
                        <option key={schema.id} value={schema.id}>
                          {schema.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* FK Table */}
                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-2">
                      Table
                    </label>
                    <select
                      className="select-field"
                      onChange={(e) => handleFkTableChange(e.target.value)}
                      value={fkTable}
                      disabled={!fkSchema || isSubmitting}
                    >
                      <option value="">Select table...</option>
                      {getFkTables().map((table) => (
                        <option key={table.id} value={table.id}>
                          {table.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* FK Column */}
                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-2">
                      Foreign Key Column
                    </label>
                    <select
                      className="select-field"
                      onChange={(e) => setFkColumn(e.target.value)}
                      value={fkColumn}
                      disabled={!fkTable || isSubmitting}
                    >
                      <option value="">Select column...</option>
                      {getFkColumns().map((column) => (
                        <option key={column.id} value={column.id}>
                          {column.name} {column.data_type ? `(${column.data_type})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Relationship Type Section */}
              <div>
                <label className="block text-sm font-medium text-blue-900 mb-2">
                  Relationship Type
                </label>
                <select
                  className="select-field max-w-xs"
                  onChange={(event) => setFkRelationshipType(event.target.value as FKRelationshipType)}
                  value={fkRelationshipType}
                  disabled={isSubmitting}
                >
                  {FK_RELATIONSHIP_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <button
                className="btn-primary max-w-xs"
                disabled={isSubmitting || !fkFormValid}
                onClick={submitFkRelationship}
                type="button"
              >
                {isSubmitting ? "Creating Relationship..." : "Create Foreign Key Relationship"}
              </button>
            </div>
          </div>
        )}

        {/* Manual Relationship Form */}
        {activeTab === "manual" && (
          <div className="surface max-w-4xl p-8">
            <h2 className="font-display text-2xl text-blue-950 mb-6">
              Create Custom Relationship
            </h2>
            <p className="text-sm text-blue-900/75 mb-6">
              Create generic relationships between any node types.
            </p>

            <div className="grid gap-6">
              {/* Source Node Section */}
              <div className="border border-blue-200 rounded-lg p-6 bg-blue-50/50">
                <h3 className="font-semibold text-blue-950 mb-4">Source Node</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-2">
                      Node Type
                    </label>
                    <select
                      className="select-field"
                      onChange={(event) => setSourceLabel(event.target.value)}
                      value={sourceLabel}
                      disabled={isSubmitting}
                    >
                      {NODE_LABELS.map((label) => (
                        <option key={label} value={label}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-2">
                      Node Name
                    </label>
                    <input
                      className="input-field"
                      onChange={(event) => setSourceName(event.target.value)}
                      placeholder="Enter source node name"
                      value={sourceName}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Target Node Section */}
              <div className="border border-blue-200 rounded-lg p-6 bg-blue-50/50">
                <h3 className="font-semibold text-blue-950 mb-4">Target Node</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-2">
                      Node Type
                    </label>
                    <select
                      className="select-field"
                      onChange={(event) => setTargetLabel(event.target.value)}
                      value={targetLabel}
                      disabled={isSubmitting}
                    >
                      {NODE_LABELS.map((label) => (
                        <option key={label} value={label}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-2">
                      Node Name
                    </label>
                    <input
                      className="input-field"
                      onChange={(event) => setTargetName(event.target.value)}
                      placeholder="Enter target node name"
                      value={targetName}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Relationship Type Section */}
              <div>
                <label className="block text-sm font-medium text-blue-900 mb-2">
                  Relationship Type
                </label>
                <select
                  className="select-field"
                  onChange={(event) => setRelation(event.target.value)}
                  value={relation}
                  disabled={isSubmitting}
                >
                  {RELATIONSHIP_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <button
                className="btn-primary max-w-xs"
                disabled={isSubmitting || !manualFormValid}
                onClick={submitManualRelationship}
                type="button"
              >
                {isSubmitting ? "Creating Relationship..." : "Create Custom Relationship"}
              </button>
            </div>
          </div>
        )}

        {/* Feedback Messages */}
        <div className="mt-6 max-w-5xl">
          {message ? (
            <div className="alert-success p-4 rounded-lg">
              <p className="text-sm font-medium text-green-800">{message}</p>
            </div>
          ) : null}

          {error ? (
            <div className="alert-error p-4 rounded-lg">
              <pre className="text-xs overflow-auto text-red-800 whitespace-pre-wrap break-words">
                {error}
              </pre>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
