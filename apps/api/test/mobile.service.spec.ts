import { ActivityStatus } from '@prisma/client';
import { PrismaService } from '../src/database/prisma.service';
import { MobileCommandDto } from '../src/modules/mobile/mobile.dto';
import { MobileService } from '../src/modules/mobile/mobile.service';

describe('MobileService commands', () => {
  const tenantA='865fe12e-62f8-432b-9509-75b125959370';
  const device='f838fb2b-2a47-480f-b816-3b0229b77c91';
  const activity='b557ebd7-d963-49a7-b94c-d2539395d106';
  const commandId='b59bc2d7-3d1e-4ce7-87a9-3647afd843eb';
  const command=(id=commandId):MobileCommandDto=>({clientCommandId:id,deviceId:device,type:'accept_activity',occurredAt:'2026-07-15T12:00:00.000Z',payload:{activityId:activity}});
  function fake(status:ActivityStatus=ActivityStatus.ASSIGNED, owner=tenantA){
    const receipts=new Map<string,unknown>();
    const tx={activity:{findUnique:jest.fn(({where})=>Promise.resolve(where.tenantId_id.tenantId===owner?{status}:null)),update:jest.fn(()=>Promise.resolve({}))},journey:{create:jest.fn()}};
    const prisma={mobileCommandReceipt:{findUnique:jest.fn(({where})=>Promise.resolve(receipts.get(JSON.stringify(where)))),create:jest.fn(({data})=>{receipts.set(JSON.stringify({tenantId_deviceId_clientCommandId:{tenantId:data.tenantId,deviceId:data.deviceId,clientCommandId:data.clientCommandId}}),{result:data.result});return Promise.resolve(data)})},$transaction:jest.fn((cb)=>cb(tx))} as unknown as PrismaService;
    return new MobileService(prisma);
  }
  it('returns duplicate for a repeated command',async()=>{const service=fake();expect((await service.commands(tenantA,[command()]))[0].status).toBe('applied');expect((await service.commands(tenantA,[command()]))[0].status).toBe('duplicate')});
  it('does not resolve an activity owned by another tenant',async()=>{expect((await fake(ActivityStatus.ASSIGNED,'other').commands(tenantA,[command()]))[0].status).toBe('rejected')});
  it('reports conflict for an invalid transition',async()=>{expect((await fake(ActivityStatus.COMPLETED).commands(tenantA,[command()]))[0].status).toBe('conflict')});
});
