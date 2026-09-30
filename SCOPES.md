# Scopes

The scopes that the commits of this repository use. A commit takes one scope in its subject, or
names several in the footer `Scopes:`. A new scope needs a reason in the review of the change.
Commit messages follow [Conventional Commits](https://www.conventionalcommits.org).

---

---

- name: agent
- label: Agent
- description: A change to the AI agent: its instructions, its model, and its configuration.

---

- name: service
- label: Service
- description: A change to the service that answers the app: its endpoint, its request and answer
  types, and the client the app calls it with.

---

- name: app
- label: Web app
- description: A change to the web app: its page and what the user sees and does on it.
