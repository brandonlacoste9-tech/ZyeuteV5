# 🇨🇦 Zyeuté Quebec Style Guide

## 🎯 Core Principle

**Every piece of UI must serve Quebec culture first.**

---

## 📝 Language Rules

### ✅ DO Use Joual/Quebec French

```tsx
// ✅ CORRECT
<Button>Envoyer</Button>
<div>Ça charge...</div>
<Alert>Oups, y'a un bobo</Alert>
```

### ❌ WRONG

```tsx
<Button>Submit</Button>
<div>Loading...</div>
<Alert>Error occurred</Alert>
```

### Required Translations

| English    | Joual                  | Usage            |
| ---------- | ---------------------- | ---------------- |
| Loading... | Ça charge...           | Loading states   |
| Submit     | Envoyer                | Forms            |
| Send       | Grouille-toi           | Urgent actions   |
| Delete     | Sacrer ça aux vidanges | Destructive      |
| Remove     | Sacrer dehors          | Destructive      |
| Add Friend | Ajouter aux chums      | Social           |
| Friend     | chum                   | Social reference |
| Error      | Oups, y'a un bobo      | Errors           |
| Cancel     | Annuler                | Cancel action    |
| Save       | Sauvegarder            | Save action      |
| Yes        | Oui                    | Confirmation     |
| No         | Non                    | Denial           |
| See More   | Voir plus              | Expansion        |
| Refresh    | Rafraîchir             | Reload           |

---

## 🎨 Color Rules

### Quebec Blue is MANDATORY for Primary Actions

```tsx
// ✅ CORRECT
<Button className="bg-zyeute-blue">Envoyer</Button>
```

```tsx
// ❌ WRONG
<Button className="bg-blue-500">Envoyer</Button>
```

### Color Palette

```css
/* Primary - Quebec Blue */
bg-zyeute-blue: #003399

/* Backgrounds - Snow White */
bg-zyeute-snow: #F8F9FA

/* Destructive - Alert Red */
bg-zyeute-alert: #DC3545

/* Highlights - Hydro Yellow */
bg-zyeute-hydro: #FFCC00
```

### Usage Examples

```tsx
// Primary button
<Button className="bg-zyeute-blue text-white">
  Envoyer
</Button>

// Destructive button
<Button className="bg-zyeute-alert text-white">
  Sacrer ça aux vidanges
</Button>

// Card background
<Card className="bg-zyeute-snow border-zyeute-blue">
  ...
</Card>

// Highlight/notification
<Badge className="bg-zyeute-hydro text-zyeute-blue">
  Nouveau!
</Badge>
```

---

## 🧪 Validation Workflow

### Before Every Commit

```bash
# 1. Run design validation
npx ts-node scripts/test-trinity.ts

# 2. Check for English text
grep -rn "Loading\.\.\." components/ app/
grep -rn "Submit" components/ app/
grep -rn "Delete" components/ app/

# 3. Check for generic colors
grep -rn "bg-blue-500" components/ app/
```

### In Your Component

```typescript
import { validateDesignTool } from "@/backend/ai/orchestrator";

const validation = await validateDesignTool.execute({
  component_code: myComponentCode,
  component_type: "button",
});

if (!validation.compliant) {
  console.error("Quebec compliance failed:");
  console.error(validation.suggestions);
}
```

---

## 📊 Cultural Score Guidelines

### Content Scoring (0.0 - 1.0)

- **0.9 - 1.0**: Excellently Quebec (poutine, Habs, Joual slang)
- **0.7 - 0.9**: Strongly Quebec (Montreal, Quebec French)
- **0.5 - 0.7**: Moderately Quebec (French, Quebec references)
- **0.3 - 0.5**: Barely Quebec (minimum acceptable)
- **0.0 - 0.3**: Not Quebec (reject)

### Boosters

- Joual dialect: +0.3
- Montreal/MTL/514: +0.2
- Quebec City/418: +0.15
- Poutine, hockey, Habs: +0.05 each
- Quebec slang (tabarnak, tsé): +0.03 each

### Penalties

- English-only: -0.5
- Non-Quebec location: -0.3
- Generic Canadian: -0.2

---

## 🚫 Common Mistakes to Avoid

### 1. English UI Text

```tsx
// ❌ WRONG
<Button>Click Here</Button>

// ✅ CORRECT
<Button>Cliquer ici</Button>
```

### 2. Generic Blue

```tsx
// ❌ WRONG
<div className="bg-blue-500">

// ✅ CORRECT
<div className="bg-zyeute-blue">
```

### 3. Non-Quebec Content

```tsx
// ❌ WRONG - Generic Canadian
const content = "Hockey in Canada";

// ✅ CORRECT - Quebec-specific
const content = "Les Habs à Montréal";
```

---

## ✅ Quick Checklist

- [ ] All UI text in French/Joual
- [ ] Primary actions use `bg-zyeute-blue`
- [ ] Destructive actions use `bg-zyeute-alert`
- [ ] No "Loading..." (use "Ça charge...")
- [ ] No "Submit" (use "Envoyer")
- [ ] No "Delete" (use "Sacrer ça aux vidanges")
- [ ] Cultural scores >= 0.3
- [ ] Design validation passes
- [ ] Tests pass

---

## 🎓 Resources

- **Ti-Guy Documentation**: `/backend/ai/README.md`
- **Test Suite**: `npm run test:trinity`
- **Design Validator**: `/api/validate-design`
- **Trends API**: `/api/trends`

---

**Remember: We're building Quebec's digital sovereignty! 🐝⚡**
