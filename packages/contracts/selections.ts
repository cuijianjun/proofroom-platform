import {z,key,version,pin} from './index';
export const color=z.enum(['red','yellow','green','blue','purple']);
export const mark=z.discriminatedUnion('action',[z.strictObject({action:z.literal('toggle'),on:z.boolean()}),z.strictObject({action:z.literal('rating'),rating:z.number().int().min(0).max(5)}),z.strictObject({action:z.literal('color'),color:color.nullable()})]);
export const markInput=z.strictObject({key,version,selectionVersion:version,mark});
const commentBody=z.string().min(1).max(2000).refine(s=>!!s.trim(),'备注不能只包含空白');
export const commentInput=z.strictObject({key,version,selectionVersion:version,body:commentBody});
export const editCommentInput=commentInput.extend({commentVersion:version});
export const removeCommentInput=commentInput.omit({body:true}).extend({commentVersion:version});
export const completeInput=z.strictObject({key,selectionVersion:version});
export const resetPinInput=z.strictObject({key,version,pin});
export const photoQuery=z.strictObject({role:z.enum(['original','retouched']).default('original'),selected:z.enum(['true','false']).optional(),q:z.string().max(100).default(''),cursor:z.string().max(512).optional()});
export type ClientContext={studioId:string;orderId:string;sessionHash:string;tokenHash:string};
export type MarkInput=z.infer<typeof markInput>;
export type PhotoActor={kind:'studio';context:{studioId:string;userId:string;role:'owner'|'admin'|'member';state:'active'|'readonly'|'suspended'}}|{kind:'client';context:ClientContext};
export type Photo={id:string;filename:string;sequence:number|null;version:number;role:'original'|'retouched';processingState:string;previewUrl:string|null;thumbnailUrl:string|null;selected:boolean;mineSelected:boolean;marks:{client:{rating:number;color:z.infer<typeof color>|null};studio:{rating:number;color:z.infer<typeof color>|null}};comments:{id:string;body:string;version:number;authorRole:'client'|'studio';authorLabel:string;editable:boolean;createdAt:string}[];batchId?:string;itemId?:string;bytes?:number;sha256?:string};
export type SelectionSummary={selectedCount:number;quota:number;overage:number;selectionVersion:number;completedSelectionVersion:number|null;completedAt:string|null;requiresResubmit:boolean;added:string[];removed:string[];notesChanged:string[];marksChanged:string[];batchesKnown:boolean;uploadsReady:boolean;visibilityReady:boolean};
export type PhotoPage={mutation?:{photoId:string;commentId?:string};items:Photo[];nextCursor:string|null;total:number;summary:SelectionSummary;workflowStage:string;canEdit:boolean};

export type ClientOverview={requiresPin:boolean;project:null|{id:string;title?:string;customerName?:string;requirement?:Pick<import('./presales').Inquiry,'answers'|'snapshot'>;booking?:{startAt:string;endAt:string}|null;workflowStage:string;lifecycleStatus:'active'|'cancelled';selectionVersion?:number;completedSelectionVersion?:number|null;completedAt?:string|null;quota?:number;agreement?:import('./orders').Project['agreement'];expiresAt?:string|null;contact:string;brand:string;canEdit:boolean;readOnlyReason?:string;message?:string}};
