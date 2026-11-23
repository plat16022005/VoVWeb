import { AuthenticatedOperator } from './gacha.types.js';
interface FirestoreValue {
    nullValue?: null;
    booleanValue?: boolean;
    integerValue?: string;
    doubleValue?: number;
    timestampValue?: string;
    stringValue?: string;
    arrayValue?: {
        values?: FirestoreValue[];
    };
    mapValue?: {
        fields?: Record<string, FirestoreValue>;
    };
}
export interface FirestoreRestDocument {
    name: string;
    fields?: Record<string, FirestoreValue>;
    createTime?: string;
    updateTime?: string;
}
export interface FirestoreBatchWrite {
    update?: {
        name: string;
        fields: Record<string, FirestoreValue>;
    };
    updateMask?: {
        fieldPaths: string[];
    };
    updateTransforms?: Array<{
        fieldPath: string;
        increment: {
            integerValue: string;
        };
    }>;
    delete?: string;
}
export declare class GachaFirebaseService {
    private readonly logger;
    private cachedCerts;
    private certsExpiresAt;
    private cachedServiceAccountToken;
    get projectId(): string;
    private normalizeDatabaseId;
    private getDocumentsBaseUrl;
    private getServiceAccountCreds;
    private getServiceAccountAccessToken;
    private getGooglePublicCerts;
    verifyFirebaseIdToken(authHeader?: string): Promise<{
        uid: string;
        email: string;
        idToken: string;
    }>;
    private resolveFirestoreBearerToken;
    authorizeOperator(authHeader: string | undefined, options: {
        adminOnly?: boolean;
        permissionGroupId?: string;
        permissionGroupLabel?: string;
        requiredAnyPermissions?: string[];
    }): Promise<AuthenticatedOperator>;
    authorizeAuthenticatedUser(authHeader?: string): Promise<{
        uid: string;
        email: string;
        username: string;
        role: string;
        authTokenForFirestore: string;
    }>;
    getPublicOrServiceToken(authHeader?: string): Promise<string>;
    toFirestoreValue(value: unknown): FirestoreValue;
    objectToFields(obj: Record<string, unknown>): Record<string, FirestoreValue>;
    fromFirestoreValue(val: FirestoreValue | undefined): unknown;
    docToObject(doc: FirestoreRestDocument): Record<string, unknown>;
    extractDocId(docName: string): string;
    fullDocumentName(docPath: string, databaseId?: string): string;
    private requestJson;
    getDocument(docPath: string, token: string, databaseId?: string): Promise<FirestoreRestDocument | null>;
    listDocuments(collectionPath: string, token: string, pageSize?: number, databaseId?: string): Promise<FirestoreRestDocument[]>;
    createDocument(collectionPath: string, documentId: string | null, data: Record<string, unknown>, token: string, databaseId?: string): Promise<FirestoreRestDocument>;
    deleteDocument(docPath: string, token: string, databaseId?: string): Promise<void>;
    commitWrites(writes: FirestoreBatchWrite[], token: string, databaseId?: string): Promise<void>;
    runQuery(parentPath: string, structuredQuery: Record<string, unknown>, token: string, databaseId?: string): Promise<FirestoreRestDocument[]>;
}
export {};
