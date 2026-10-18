-- The platform has three workspace types: theater, meeting-room and private-office.
-- Room kinds saved earlier (hot-desk, shared-desk, mixed, event-hall, auditorium ...) are mapped onto them.
-- The booking category (WorkspaceSection.type: DESK / MEETING_ROOM / THEATER) is not touched.
UPDATE "WorkspaceSection"
SET "subType" = CASE
  WHEN lower("subType") ~ '(theater|theatre|auditorium)' THEN 'theater'
  WHEN lower("subType") ~ '(hall|meeting|room|majlis|conference|training|workshop|event|lecture)' AND lower("subType") NOT LIKE '%office%' THEN 'meeting-room'
  ELSE 'private-office'
END
WHERE "subType" IS NOT NULL
  AND "subType" NOT IN ('theater', 'meeting-room', 'private-office');
