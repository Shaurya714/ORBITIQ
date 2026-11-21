# ORBITIQ
### Orbital Collision Risk Analysis & Manoeuvre Decision Support

ORBITIQ is an orbital safety and decision-support platform designed to help satellite operators monitor close approaches, understand collision risks, simulate orbital encounters, and evaluate potential collision-avoidance manoeuvres.

As Earth's orbital environment becomes increasingly crowded with active satellites, inactive spacecraft and debris, identifying dangerous encounters and evaluating the consequences of orbital manoeuvres is becoming more challenging. ORBITIQ aims to simplify this process by bringing orbital data, encounter analysis, simulation and manoeuvre assessment into a unified workspace.

---

## Overview

ORBITIQ transforms orbital monitoring from passive tracking into a more analytical decision-support workflow.

The platform combines orbital data from multiple sources with orbital propagation, encounter analysis and interactive simulation to help users understand potential threats and explore possible responses.

### Core Workflow

**Detect → Assess → Simulate → Compare → Decide**

- **Detect:** Identify orbital objects and potential close-approach events.
- **Assess:** Examine relative motion, encounter geometry and separation.
- **Simulate:** Explore orbital behaviour and manoeuvre scenarios.
- **Compare:** Evaluate the original trajectory against alternative trajectories.
- **Decide:** Understand potential avoidance options and their consequences.

---

## Problem Statement

Earth's orbit is increasingly congested with active satellites, inactive spacecraft and space debris. Even relatively small objects can pose significant threats because of their high orbital velocities.

Satellite operators must evaluate close-approach alerts, assess collision likelihood, understand potential consequences and determine whether an avoidance manoeuvre is necessary.

Existing orbital data is distributed across different sources, while collision analysis and manoeuvre evaluation require specialized knowledge of orbital mechanics.

ORBITIQ aims to make orbital encounter analysis more accessible through a unified interface for orbital data monitoring, visualization, simulation and decision support.

---

## Key Features

### 1. Orbital Data Integration

Retrieve orbital information from multiple sources to support satellite monitoring and analysis.

- CelesTrak GP orbital data.
- Space-Track catalog and orbital data.
- Satellite and space-object identification.
- Provider connectivity and configuration management.
- Unified data access through the platform backend.

### 2. Close-Approach Monitoring

A dedicated workspace for examining orbital encounter events and potential conjunction threats.

- Close-approach monitoring.
- Object identification and orbital information.
- Miss-distance and encounter geometry analysis, where available.
- Threat-oriented inspection.
- Access to conjunction-related information and analysis.

### 3. Orbital Manoeuvre Simulator

An interactive orbital simulation environment designed to visualize satellite orbital motion and study changes in orbital trajectories.

- Satellite orbital visualization.
- Trajectory propagation.
- Interactive simulation controls.
- Orbital parameter exploration.
- Manoeuvre and delta-v analysis.
- Comparison of orbital trajectories.

### 4. Collision Analysis & Relative Motion

Analyze the geometry of encounters between orbital objects.

- Relative position.
- Relative velocity.
- Closest-approach estimation.
- Encounter geometry.
- Collision-envelope screening.
- Orbital trajectory comparison.

### 5. Collision-Avoidance Decision Support

The long-term objective is to evaluate potential manoeuvre strategies and provide a physics-grounded comparison of avoidance options.

- Candidate manoeuvre evaluation.
- Burn timing and direction analysis.
- Delta-v cost comparison.
- Predicted post-manoeuvre separation.
- Secondary conjunction screening.
- Explainable recommendations based on computed results.

Advanced manoeuvre optimization and uncertainty-aware collision prediction are subject to implementation and validation.

---

## Technology Stack

### Frontend

- React.js
- JavaScript
- Vite
- Tailwind CSS
- CSS

### Backend

- Backend REST API
- Server-side data retrieval and processing
- Environment-based configuration for API credentials

### Orbital Mechanics

- SGP4 orbital propagation for applicable catalog orbital elements.
- Newtonian gravitational mechanics.
- Vector-based position and velocity analysis.
- Numerical trajectory propagation.
- Relative-motion and closest-approach calculations.

### External Data Sources

| Provider | Purpose |
|---|---|
| Space-Track | Orbital catalog data and space-object information |
| CelesTrak | GP orbital elements and satellite tracking data |

### Development & Testing

- Local frontend development using Vite.
- Backend service running locally.
- Vite proxy for API communication.
- ngrok for temporary public access during testing and demonstrations.

---

## System Architecture

```text
                    ORBITIQ
                       |
          +------------+-------------+
          |                          |
     React Frontend              Backend API
     Vite + Tailwind             Data Processing
          |                          |
          +------------+-------------+
                       |
              External Data Sources
                       |
          +------------+-------------+
          |                          |
       CelesTrak                 Space-Track
       GP API                    API
          |
          v
    Orbital Data & Object States
          |
          v
    Orbital Analysis / Simulation
          |
          v
    Encounter Assessment &
    Manoeuvre Decision Support
```

### Data Flow

1. The frontend requests orbital and provider information from the backend.
2. The backend retrieves data from configured orbital data providers.
3. Orbital information is parsed and processed into usable object states.
4. The simulation and analysis components use the available orbital information.
5. Calculated outputs are presented through the ORBITIQ interface.

---

## Orbital Mechanics

ORBITIQ relies on orbital mechanics to represent satellite motion and evaluate orbital encounters.

### Orbital Propagation

SGP4 is used for propagation of applicable TLE/GP orbital elements to obtain satellite state information over time.

### Relative Motion

For two orbital objects, relative position and relative velocity can be represented as:

\[
\mathbf{r}_{rel}=\mathbf{r}_2-\mathbf{r}_1
\]

\[
\mathbf{v}_{rel}=\mathbf{v}_2-\mathbf{v}_1
\]

These quantities form the basis of encounter geometry and separation analysis.

### Closest Approach

A relative-motion approximation can estimate time to closest approach:

\[
t_{CA}=-\frac{\mathbf{r}_{rel}\cdot\mathbf{v}_{rel}}
{\|\mathbf{v}_{rel}\|^2}
\]

The corresponding predicted separation can be evaluated using the relative state.

For extended prediction intervals, numerical propagation is more appropriate than assuming constant relative velocity.

### Manoeuvre Analysis

A manoeuvre changes the spacecraft velocity by a specified delta-v:

\[
\Delta\mathbf{v}
\]

The resulting state is propagated to evaluate how the orbital trajectory and encounter geometry change.

---

## Project Structure

The project is organized around a frontend interface, backend data services and orbital analysis components.

```text
ORBITIQ/
│
├── frontend/
│   ├── React components
│   ├── pages and workspaces
│   ├── orbital visualization
│   ├── simulation controls
│   └── styles
│
├── backend/
│   ├── API endpoints
│   ├── data provider integrations
│   ├── orbital data processing
│   └── analysis services
│
├── .env
├── package.json
└── vite.config.js
```

*The directory structure above is conceptual. Actual filenames and organization may differ in the current repository.*

---

## Installation & Setup

### Prerequisites

- Node.js and npm.
- Python, if required by the backend.
- Space-Track account for authenticated data access.
- Internet connection.

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ORBITIQ
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a backend `.env` file and configure the required credentials.

Example configuration:

```env
PORT=8000

SPACETRACK_USERNAME=your_username
SPACETRACK_PASSWORD=your_password
```

Never expose Space-Track credentials in frontend code or commit them to GitHub.

### 4. Start the Backend

Start the backend server using the project's configured startup command.

The backend is expected to be accessible locally at:

```text
http://localhost:8000
```

### 5. Start the Frontend

```bash
npm run dev
```

Vite runs the frontend on:

```text
http://localhost:5173
```

API requests through `/api` are proxied to the backend at port `8000` through the Vite development configuration.

---

## Sharing the Local Build

For temporary demonstrations, ORBITIQ can be shared using ngrok.

```bash
ngrok http 5173
```

ngrok generates a temporary public HTTPS URL that allows others to access the locally running frontend.

Ensure the backend is running and the frontend API proxy is configured correctly before sharing.

The local services must remain running for the public link to work.

---

## Scientific Limitations

ORBITIQ is a research and prototype decision-support platform, not an operational collision-avoidance system.

- Orbital element data is subject to uncertainty and age.
- Propagated trajectories may deviate from actual orbital behaviour.
- TLE/GP data alone does not provide sufficient covariance information for reliable collision probability estimation.
- Closest-approach distance is not equivalent to collision probability.
- Impact consequences depend on object mass, geometry, relative velocity, spacecraft design and other factors.
- Manoeuvre predictions require accurate state information, spacecraft constraints and validated propagation.
- Avoidance recommendations must not be treated as certified operational instructions.

All collision assessments and manoeuvre recommendations require validation against authoritative orbital data and operational analysis.

---

## Future Development

- Real-time conjunction analysis.
- Improved encounter-plane visualization.
- Relative-motion and collision-envelope analysis.
- Physics-based avoidance manoeuvre search.
- Delta-v optimization.
- Post-manoeuvre trajectory comparison.
- Secondary conjunction screening.
- Uncertainty-aware collision probability assessment.
- Explainable AI-assisted decision reports.
- Improved orbital encounter visualization and simulation.

---

## Vision

ORBITIQ aims to bridge the gap between orbital tracking data and actionable collision-avoidance analysis.

By combining orbital data, physics-based simulation and explainable decision support, the platform seeks to help operators better understand orbital threats, compare avoidance strategies and make informed decisions in an increasingly congested space environment.

---

**ORBITIQ — Understand the encounter. Predict the outcome. Protect the mission.**
