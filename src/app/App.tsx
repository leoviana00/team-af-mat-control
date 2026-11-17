import { useState } from 'react'

const modules = [
  {
    id: 'timer',
    number: '01',
    title: 'Training Timer',
    description: 'Cronômetros para treinos, rounds e intervalos.',
    status: 'Em breve',
  },
  {
    id: 'scoreboard',
    number: '02',
    title: 'Match Scoreboard',
    description: 'Placar de lutas com pontos, vantagens e punições.',
    status: 'Em breve',
  },
  {
    id: 'interval',
    number: '03',
    title: 'Interval Training',
    description: 'Treinos intervalados com ciclos de atividade e descanso.',
    status: 'Em breve',
  },
  {
    id: 'class',
    number: '04',
    title: 'Class Management',
    description: 'Organização das etapas e atividades da aula.',
    status: 'Em breve',
  },
]

function App() {
  const [activeModule, setActiveModule] = useState('timer')

  const selectedModule = modules.find(
    (module) => module.id === activeModule,
  )

  return (
    <div className="app-shell">
      <header className="app-header">
        <a className="brand" href="#" aria-label="TEAM AF Mat Control - Início">
          <img
            className="brand-logo"
            src={`${import.meta.env.BASE_URL}assets/team-af-logo.png`}
            alt="TEAM AF"
          />
          <div className="brand-text">
            <span className="brand-name">TEAM AF</span>
            <span className="brand-subtitle">MAT CONTROL</span>
          </div>
        </a>

        <div className="header-status">
          <span className="status-dot" />
          TRAINING SYSTEM
        </div>
      </header>

      <main className="main-content">
        <section className="welcome-section">
          <div className="eyebrow">JIU-JITSU TRAINING PLATFORM</div>
          <h1>
            Controle o treino.
            <br />
            <span>Domine o tatame.</span>
          </h1>
          <p>
            Ferramentas para organizar, controlar e acompanhar
            as atividades no tatame.
          </p>
        </section>

        <section className="modules-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">PLATAFORMA</span>
              <h2>Módulos de treinamento</h2>
            </div>
            <span className="module-count">04 MÓDULOS</span>
          </div>

          <nav className="module-grid" aria-label="Módulos">
            {modules.map((module) => (
              <button
                className={`module-card ${
                  activeModule === module.id ? 'active' : ''
                }`}
                key={module.id}
                onClick={() => setActiveModule(module.id)}
                aria-pressed={activeModule === module.id}
              >
                <div className="module-card-top">
                  <span className="module-number">{module.number}</span>
                  <span className="module-arrow">↗</span>
                </div>

                <h3>{module.title}</h3>
                <p>{module.description}</p>

                <div className="module-card-footer">
                  <span className="module-status">{module.status}</span>
                  <span className="status-line" />
                </div>
              </button>
            ))}
          </nav>
        </section>

        <section className="workspace">
          <div className="workspace-heading">
            <div>
              <span className="eyebrow">ÁREA DE TRABALHO</span>
              <h2>{selectedModule?.title}</h2>
            </div>
            <span className="workspace-badge">PREPARAÇÃO</span>
          </div>

          <div className="workspace-placeholder">
            <div className="placeholder-icon">AF</div>
            <h3>Seu próximo treino começa aqui.</h3>
            <p>
              Este módulo será implementado nas próximas etapas
              do projeto.
            </p>
          </div>
        </section>
      </main>

      <footer className="app-footer">
        <span>TEAM AF MAT CONTROL</span>
        <span>BUILT FOR THE MAT</span>
      </footer>
    </div>
  )
}

export default App
