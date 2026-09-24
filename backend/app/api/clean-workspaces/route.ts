import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";

export async function POST(request: Request) {
  const user = getTokenFromRequest(request);
  if (!user || user.role !== "SUPER_ADMIN") return unauthorizedResponse();

  const logs: string[] = [];
  try {
    const keepId = '5ebb9c03-a292-4f2e-8a3e-f26afb903757';
    const deleteIds = [
      'dbf06036-26b0-4a13-9406-25dac7f13367',
      'c795c485-2028-4a4b-9737-afa30e4b93f4',
      'b9a6545e-6cf7-44ac-9ae3-d5715d24602c',
      'd252a0d5-c52f-4634-81e4-79d963f9bd55',
    ];

    const primaryWs = await prisma.workspace.findUnique({
      where: { id: keepId },
      include: { sections: { include: { hourlyPackages: true } } },
    });

    if (!primaryWs) {
      return NextResponse.json({ error: 'Primary workspace not found' }, { status: 404 });
    }

    const primarySection = primaryWs.sections[0];
    let primaryPkg: any = primarySection?.hourlyPackages?.[0];
    if (!primaryPkg && primarySection) {
      primaryPkg = await prisma.hourlyPackage.findFirst({ where: { sectionId: primarySection.id } });
    }
    if (!primaryPkg && primarySection) {
      primaryPkg = await prisma.hourlyPackage.create({
        data: {
          sectionId: primarySection.id,
          packageName: '1 Hour Pass',
          hoursAmount: 1,
          periodType: 'PER_DAY',
          price: 25,
        },
      });
      logs.push(`Created fallback primary package ${primaryPkg.id}`);
    }

    for (const dupId of deleteIds) {
      logs.push(`Processing duplicate ${dupId}...`);
      
      const dupWs = await prisma.workspace.findUnique({
        where: { id: dupId },
        include: { sections: true },
      });

      if (!dupWs) {
        logs.push(`Workspace ${dupId} already deleted or not found.`);
        continue;
      }

      // Re-link direct bookings by workspaceId
      if (primarySection) {
        const dbUpdate = await prisma.directBooking.updateMany({
          where: { workspaceId: dupId },
          data: { workspaceId: keepId, sectionId: primarySection.id },
        });
        logs.push(`Re-linked ${dbUpdate.count} direct bookings by workspaceId.`);

        const qrUpdate = await prisma.qrCheckIn.updateMany({
          where: { workspaceId: dupId },
          data: { workspaceId: keepId, sectionId: primarySection.id },
        });
        logs.push(`Re-linked ${qrUpdate.count} QR checkins by workspaceId.`);
      }

      for (const sec of dupWs.sections) {
        // Find all packages for this section
        const secPackages = await prisma.hourlyPackage.findMany({ where: { sectionId: sec.id } });
        const secPkgIds = secPackages.map((p: any) => p.id);

        if (primarySection && primaryPkg) {
          const hbUpdate = await prisma.hourlyBooking.updateMany({
            where: {
              OR: [
                { sectionId: sec.id },
                ...(secPkgIds.length > 0 ? [{ packageId: { in: secPkgIds } }] : []),
              ],
            },
            data: { sectionId: primarySection.id, packageId: primaryPkg.id },
          });
          logs.push(`Re-linked ${hbUpdate.count} hourly bookings for section ${sec.id} and its packages.`);

          const dbSecUpdate = await prisma.directBooking.updateMany({
            where: { sectionId: sec.id },
            data: { workspaceId: keepId, sectionId: primarySection.id },
          });
          logs.push(`Re-linked ${dbSecUpdate.count} direct bookings for section ${sec.id}.`);

          const qrSecUpdate = await prisma.qrCheckIn.updateMany({
            where: { sectionId: sec.id },
            data: { workspaceId: keepId, sectionId: primarySection.id },
          });
          logs.push(`Re-linked ${qrSecUpdate.count} QR checkins for section ${sec.id}.`);
        } else {
          const hbDel = await prisma.hourlyBooking.deleteMany({
            where: {
              OR: [
                { sectionId: sec.id },
                ...(secPkgIds.length > 0 ? [{ packageId: { in: secPkgIds } }] : []),
              ],
            },
          });
          logs.push(`Deleted ${hbDel.count} hourly bookings.`);
        }

        // Delete hourly packages for this section
        const pkgDel = await prisma.hourlyPackage.deleteMany({ where: { sectionId: sec.id } });
        logs.push(`Deleted ${pkgDel.count} hourly packages for section ${sec.id}.`);

        // Delete the section
        await prisma.workspaceSection.delete({ where: { id: sec.id } });
        logs.push(`Deleted section ${sec.id}.`);
      }

      // Delete workspace amenities
      const amDel = await prisma.workspaceAmenity.deleteMany({ where: { workspaceId: dupId } });
      logs.push(`Deleted ${amDel.count} workspace amenities.`);

      // Delete workspace
      await prisma.workspace.delete({ where: { id: dupId } });
      logs.push(`Deleted workspace ${dupId} successfully!`);
    }

    // Ensure all sections belonging to The Hub Riyadh have clear names matching all other workspaces
    const hubSections = await prisma.workspaceSection.findMany({
      where: { workspaceId: keepId },
      include: { hourlyPackages: true },
    });

    for (const sec of hubSections) {
      if (sec.type === 'DESK') {
        await prisma.workspaceSection.update({
          where: { id: sec.id },
          data: {
            name: 'The Hub Riyadh - Open Desks Area',
            capacity: 50,
            dailyRate: 150,
            monthlyRate: 1800,
            yearlyRate: 18000,
          },
        });
        await prisma.hourlyPackage.updateMany({
          where: { sectionId: sec.id },
          data: { packageName: 'The Hub Riyadh - 1 Hour Desk Pass' },
        });
        logs.push(`Standardized DESK section ${sec.id} to 'The Hub Riyadh - Open Desks Area'`);
      } else if (sec.type === 'MEETING_ROOM') {
        await prisma.workspaceSection.update({
          where: { id: sec.id },
          data: {
            name: 'The Hub Riyadh - Meeting Room',
            capacity: 10,
            dailyRate: 300,
          },
        });
        await prisma.hourlyPackage.updateMany({
          where: { sectionId: sec.id },
          data: { packageName: 'The Hub Riyadh - 1 Hour Meeting Pass' },
        });
        logs.push(`Standardized MEETING_ROOM section ${sec.id} to 'The Hub Riyadh - Meeting Room'`);
      } else if (sec.type === 'THEATER') {
        await prisma.workspaceSection.update({
          where: { id: sec.id },
          data: {
            name: 'The Hub Riyadh - Event Space / Theater',
            capacity: 60,
            dailyRate: 1000,
          },
        });
        await prisma.hourlyPackage.updateMany({
          where: { sectionId: sec.id },
          data: { packageName: 'The Hub Riyadh - 1 Hour Event Pass' },
        });
        logs.push(`Standardized THEATER section ${sec.id} to 'The Hub Riyadh - Event Space / Theater'`);
      }
    }

    // Return remaining workspaces and updated sections
    const remaining = await prisma.workspace.findMany({
      where: { name: { contains: 'The Hub', mode: 'insensitive' } },
      include: { sections: { include: { hourlyPackages: true } } },
    });

    return NextResponse.json({
      success: true,
      logs,
      remainingHubCount: remaining.length,
      remaining,
    });
  } catch (error: any) {
  console.error("[clean-workspaces Error]:", error);
  return NextResponse.json({
    success: false,
    logs,
    error: "An error occurred while processing the request.",
  }, { status: 500 });
}
}
