import { gql } from "apollo-server-express";

const schema = gql`
  # Métrique de qualité pour une variable/colonne individuelle
  type VariableQualityMetric {
    featureId: ID!
    name: String!
    label: String
    missingCount: Int!
    missingPercentage: Float!
    outliersCount: Int!
    score: Float!
    hasAnomaly: Boolean!
  }

  # Représente un rapport de qualité généré pour un fichier précis.
  # Un fichier peut avoir plusieurs rapports au fil du temps (un par
  # génération), on garde toujours le dernier comme référence.
  type DataQualityReport {
    id: ID!
    fileId: ID!
    completeness: Float      # complétude : proportion de valeurs non manquantes
    consistency: Float       # cohérence : proportion de colonnes avec un type détecté
    validity: Float          # validité : proportion de valeurs numériques hors outliers
    uniqueness: Float         # unicité : proportion de lignes non dupliquées
    accuracy: Float           # exactitude : approximation basée sur la complétude
    missingValuesCount: Int
    duplicateRowsCount: Int
    outliersCount: Int
    invalidValuesCount: Int
    qualityScore: Float       # score global sur 100, combinant les 5 dimensions
    variableMetrics: [VariableQualityMetric!]
    createdAt: String
  }

  # Enveloppe de réponse standard, même pattern que dans Feature/Project
  type DataQualityReportResponse {
    success: Boolean
    message: String
    report: DataQualityReport
  }

  type Mutation {
    # Déclenche le calcul complet (appels FastAPI + Feature) et sauvegarde
    # un nouveau rapport en base. À appeler après un upload ou une
    # transformation de données.
    generateDataQualityReport(fileId: ID!): DataQualityReportResponse! @auth
  }

  type Query {
    # Relit le dernier rapport déjà généré pour un fichier, sans
    # relancer aucun calcul. Utilisé pour l'affichage côté frontend.
    getDataQualityReport(fileId: ID!): DataQualityReportResponse! @auth
  }
`;

export default schema;
