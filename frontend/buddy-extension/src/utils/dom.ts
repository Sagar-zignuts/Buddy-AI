export function extractProblemText(): string {
  const hostname = location.hostname;

  // LeetCode problem description
  if (hostname.includes("leetcode.com")) {
    const el =
      document.querySelector('[data-track-load="description_content"]') ||
      document.querySelector(".question-content__JfgR");
    if (el) return (el as HTMLElement).innerText.trim();
  }

  // HackerRank problem description
  if (hostname.includes("hackerrank.com")) {
    const el =
      document.querySelector(".problem-statement") ||
      document.querySelector(".view-lines");
    if (el) return (el as HTMLElement).innerText.trim();
  }

  // Codeforces problem statement
  if (hostname.includes("codeforces.com")) {
    const el = document.querySelector(".problem-statement");
    if (el) return (el as HTMLElement).innerText.trim();
  }

  // Fallback: try article or main content
  const article = document.querySelector("article, main");
  if (article) return (article as HTMLElement).innerText.trim();

  return "";
}
