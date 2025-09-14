# Backend 
## How to run
1. Install the packages using this command:
```bash
npm i
```
2. Copy the .env.example file to a .env file.
3. Generate the prisma files:
```bash
npx prisma migrate dev
npx prisma generate
```
4. Execute the command:
```bash
npm run start
```

## How to access
You can access the api via
```
http://localhost:3000/api/ + The path
```

## Notes
The more indepth document will be written in the wiki.
