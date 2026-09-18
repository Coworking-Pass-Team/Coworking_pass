import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
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

    // Return remaining workspaces
    const remaining = await prisma.workspace.findMany({
      where: { name: { contains: 'The Hub', mode: 'insensitive' } },
    });

    return NextResponse.json({
      success: true,
      logs,
      remainingHubCount: remaining.length,
      remaining,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      logs,
      error: error?.message || String(error),
      stack: error?.stack,
    }, { status: 500 });
  }
}
