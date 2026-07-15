import { IsIn, IsInt, IsString, IsUUID, Length, Matches, Max, Min } from 'class-validator';
export class InitiateUploadDto{
 @IsUUID() activityId!:string;
 @IsIn(['photo_material','signature']) kind!:'photo_material'|'signature';
 @IsIn(['camera','signature_pad','gallery']) origin!:'camera'|'signature_pad'|'gallery';
 @IsString() @Length(3,120) mimeType!:string;
 @IsInt() @Min(1) @Max(25_000_000) size!:number;
 @Matches(/^[a-f0-9]{64}$/) sha256!:string;
}
export class CompleteUploadDto{@IsInt() @Min(1) @Max(25_000_000) size!:number;@Matches(/^[a-f0-9]{64}$/) sha256!:string}
export class CompleteActivityDto{@IsString() @Length(2,160) receiverName!:string}
export class ProofReadyDto{
 @IsUUID() tenantId!:string;
 @IsString() @Length(1,120) bucket!:string;
 @IsString() @Length(1,500) key!:string;
 @Matches(/^[a-f0-9]{64}$/) sha256!:string;
 @IsInt() @Min(1) size!:number;
}
