# ft_transcendence – Database Schema (Multiplayer Football Game)

This document defines the **database schema** based on a **2D multiplayer football game that supports 2, 4, or 6 players per match**.

The schema must support:

* Multiple players in one match
* Team-based matches (Team A vs Team B)
* Match history
* Tournament system
* Flexible structure for future extensions

---

# 1. Core Database Models

We will use a **modular database structure** instead of hardcoding only 2 players per match.

---

## 1. User Model

This is the central table of the entire project.

### Fields

* id
* username
* email
* password (hashed)
* avatar (optional)
* created_at

### Purpose

The User table is used for:

* Authentication
* Player identity
* Match participation
* Tournament participation
* Match history

---

## 2. Match Model

This table represents one football match.

### Fields

* id
* created_at
* teamA_score
* teamB_score
* winner_team (A or B)

### Purpose

This table is used to:

* Save match results
* Support match history
* Connect players to matches

---

## 3. MatchPlayer Model (VERY IMPORTANT)

This is the key model that allows the game to support **2, 4, or 6 players**.

Instead of storing only player1 and player2 in the Match table, we use a separate table.

### Fields

* id
* match (ForeignKey → Match)
* user (ForeignKey → User)
* team (Team A or Team B)
* goals (optional, for statistics)

### Purpose

This model allows:

* 2 players in a match
* 4 players in a match
* 6 players in a match
* Easy tournament support
* Easy statistics later

---

## 4. Tournament Model

This table represents a tournament containing multiple matches.

### Fields

* id
* name
* created_at
* winner (ForeignKey → User)

### Purpose

Used for the tournament module required in the project.

---

## 5. TournamentMatch Model (Optional but Recommended)

This table connects matches to a tournament.

### Fields

* id
* tournament (ForeignKey → Tournament)
* match (ForeignKey → Match)

### Purpose

* Helps manage tournament brackets
* Keeps the database clean
* Makes the tournament system easier to implement

---

# 2. Database Relationships Overview

User → can play many matches
Match → can contain many players
MatchPlayer → connects users to matches
Match → belongs to a tournament (optional)
Tournament → contains many matches

---

# 3. Example (How the Database Will Work)

Example: A match with 4 players

Match Table:

* match id = 1
* teamA_score = 3
* teamB_score = 1

MatchPlayer Table:

* user1 → team A
* user2 → team A
* user3 → team B
* user4 → team B

This structure works the same way for 2 players or 6 players.

---

# 4. Why This Structure Is Perfect for the Project

This schema is:

* Simple to implement in Django
* Compatible with multiplayer matches
* Compatible with tournaments
* Easy to debug
* Flexible if we extend the game later

---