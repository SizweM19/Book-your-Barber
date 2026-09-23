import fs from 'fs';

// 1. AuthService.ts
let auth = fs.readFileSync('src/application/auth/AuthService.ts', 'utf-8');
const authLines = auth.split(/\r?\n/);
console.log('Auth first 3 lines before:');
console.log(authLines.slice(0, 3));

if (authLines[0].includes('createBrowserSupabaseClient') && authLines[1].includes('createBrowserSupabaseClient')) {
  authLines.shift();
  fs.writeFileSync('src/application/auth/AuthService.ts', authLines.join('\n'), 'utf-8');
  console.log('Successfully shifted duplicate line from AuthService.ts!');
}

const authLinesAfter = fs.readFileSync('src/application/auth/AuthService.ts', 'utf-8').split(/\r?\n/);
console.log('Auth first 3 lines after:');
console.log(authLinesAfter.slice(0, 3));

// 2. layout.tsx
let layout = fs.readFileSync('src/app/app/layout.tsx', 'utf-8');
const layoutLines = layout.split(/\r?\n/);
const filteredLayout = [];
let removedOldAuth = false;
for (const line of layoutLines) {
  if (line.includes('const { user, tenantContext, currentRole, logout } = useAuth()')) {
    removedOldAuth = true;
    continue; // Skip old line
  }
  filteredLayout.push(line);
}
if (removedOldAuth) {
  fs.writeFileSync('src/app/app/layout.tsx', filteredLayout.join('\n'), 'utf-8');
  console.log('Successfully removed duplicate old useAuth line from layout.tsx!');
} else {
  console.log('Old useAuth line was not present in layout.tsx.');
}
