export interface DriverRecord { id:string;tenantId:string;companyId:string;name:string;document?:string|null }
export interface VehicleRecord { id:string;tenantId:string;companyId:string;plate:string }
export interface CreateDriverInput { companyId:string;name:string;document?:string }
export interface CreateVehicleInput { companyId:string;plate:string }
