/**
 * Hands the /review progress to the next reviewer: commits supabase/review/ (one JSON file per
 * reviewer, so files never conflict), pulls the others' ticks, pushes, and rebuilds the SQL seeds
 * so rows already reviewed are seeded with reviewed = true.
 *
 *   npm run review:push
 */
import { execFileSync } from "node:child_process";

const git = (...args: string[]) => execFileSync("git", args, { stdio: "inherit" });
const gitOut = (...args: string[]) => execFileSync("git", args, { encoding: "utf8" }).trim();

git("add", "supabase/review");
if (gitOut("diff", "--cached", "--name-only", "--", "supabase/review")) {
  git("commit", "-m", "chore(review):Update explanation review progress", "--", "supabase/review");
} else {
  console.log("No new ticks to commit.");
}
git("pull", "--rebase", "--autostash");
git("push");

// Seeds follow the merged ticks; commit them separately so the review commit stays small.
execFileSync(process.execPath, ["scripts/generate-explanations.ts", "--write-sql"], { stdio: "inherit" });
const seeds = [..."RIASEC"].map((l) => `supabase/explanations.${l}.sql`);
git("add", ...seeds);
if (gitOut("diff", "--cached", "--name-only", "--", ...seeds)) {
  git("commit", "-m", "chore(review):Seed reviewed explanations as reviewed", "--", ...seeds);
  git("push");
}
console.log("Done. The next reviewer can pull and open /review.");
