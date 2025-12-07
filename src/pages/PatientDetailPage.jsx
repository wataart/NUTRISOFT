import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Tabs } from '../components/Tabs.jsx';
import ClinicalHistoryTab from '../components/ClinicalHistoryTab.jsx';
import InbodyTab from '../components/InbodyTab.jsx';
import GoalsTab from '../components/GoalsTab.jsx';
import Recall24hTab from '../components/Recall24hTab.jsx';
import NutritionCalcTab from '../components/NutritionCalcTab.jsx';
import MenuTab from '../components/MenuTab.jsx';

export default function PatientDetailPage() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  useEffect(() => {
    const fetchPatient = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error(error);
      } else {
        setPatient(data);
      }
      setLoading(false);
    };

    fetchPatient();
  }, [id]);

  if (loading || !patient) return <div>Cargando paciente...</div>;

  const tabs = [
    {
      key: 'historia',
      label: '1) Historia clínica',
      content: <ClinicalHistoryTab patientId={patient.id} />,
    },
    {
      key: 'inbody',
      label: '2) InBody / Progreso',
      content: <InbodyTab patientId={patient.id} />,
    },
    {
      key: 'metas',
      label: '3) Metas',
      content: <GoalsTab patientId={patient.id} />,
    },
    {
      key: 'recall',
      label: '4) 24 horas',
      content: <Recall24hTab patientId={patient.id} />,
    },
    {
      key: 'calc',
      label: '5) Cálculo nutricional',
      content: <NutritionCalcTab patientId={patient.id} />,
    },
    {
      key: 'menu',
      label: '6) Menú',
      content: <MenuTab patientId={patient.id} />,
    },
  ];

  return (
    <div className="patient-detail">
      <header className="patient-detail-header">
        <div>
          <h2>
            {patient.nombre} {patient.apellido}
          </h2>
          {/* aquí puedes mostrar edad, sexo, etc. */}
        </div>
        <Link to="/">← Volver a pacientes</Link>
      </header>

      <Tabs
        tabs={tabs}
        active={activeTabIndex}
        onChange={setActiveTabIndex}
      />
    </div>
  );
}
