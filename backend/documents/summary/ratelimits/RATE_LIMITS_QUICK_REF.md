# Rate Limits Quick Reference - 70+ Concurrent Users

## All Updated Limits

```
✅ General API:              500 req/15min  (was 100)
✅ Strict DB Queries:        150 req/15min  (was 30)
✅ Authentication:           20 req/15min   (was 5) - safety measure
✅ Write Operations:         100 req/15min  (was 20)
✅ Search/Filter:            250 req/15min  (was 50)
✅ Admin Reads:              300 req/15min  (was 60)
✅ Admin Writes:             150 req/15min  (was 30)
✅ Admin Critical:           100 req/1hour  (was 20)
✅ Admin Announcements:      50 req/1hour   (was 10)
✅ Dashboard:                1000 req/15min (was 200)
✅ Student Preferences:      500 req/15min  (was 100)
```

## User Impact Examples

### Typical Student Workflow (1000 req/15min dashboard)
- Dashboard refresh: every 30 seconds = ~60 requests ✅
- Search jobs: 5 searches = ~10 requests ✅
- Check applications: 10 times = ~20 requests ✅
- Update preferences: 2 times = ~5 requests ✅
- **Total: ~95 requests/15min** - Well under limit!

### Typical Employer Workflow (1000 req/15min dashboard)
- Dashboard refresh: every 30 seconds = ~60 requests ✅
- Review applications: 20 views = ~20 requests ✅
- Job operations: 5 actions = ~10 requests ✅
- **Total: ~90 requests/15min** - Well under limit!

### Heavy Admin Workflow (300 req/15min reads, 100 req/15min writes)
- Dashboard: every minute = ~15 reads ✅
- User listings: 10 views = ~20 reads ✅
- Approvals: 5 actions = ~10 writes ✅
- Announcements: 2 announcements/hour = OK for hourly limit ✅

## Security Notes

⚠️ **Authentication still protected**: 20 attempts/15min per IP
- Prevents brute force attacks
- Successful logins don't count (skipSuccessfulRequests)

⚠️ **Admin operations controlled**:
- Critical ops: 100/hour (thoughtful limiting)
- Announcements: 50/hour (prevents spam)

## Scaling Calculation

All limits were increased by **5x** from original:
- For 70 users: Each user gets roughly (limit × 1.5) / 70 requests
- Example: 500 general requests / 70 users ≈ 7 requests per user per 15 minutes
- This allows ~1 general request per 2 minutes per user

Safe from DoS while supporting concurrent usage.
