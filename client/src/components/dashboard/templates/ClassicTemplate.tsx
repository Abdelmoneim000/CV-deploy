import { useCvContext } from '../../../context/CvContext';
import CvHeader from '../sections/CvHeader';
import CvSummary from '../sections/CvSummary';
import CvProjects from '../sections/CvProjects';
import CvEducation from '../sections/CvEducation';
import CvExperience from '../sections/CvExperience';
import CvLanguages from '../sections/CvLanguages';
import CvSkills from '../sections/CvSkills';
import CvFindMeOnline from '../sections/CvFindMeOnline';

const SECTION_COMPONENTS: Record<string, React.FC<any>> = {
  summary: CvSummary,
  projects: CvProjects,
  education: CvEducation,
  experience: CvExperience,
  languages: CvLanguages,
  skills: CvSkills,
  findMeOnline: CvFindMeOnline,
};

const ClassicTemplate = ({ editable }: { editable: boolean }) => {
  const { cvData } = useCvContext();
  const sectionSpacing = cvData?.data?.theme?.sectionSpacing || '18pt';

  return (
    <div className="w-[8.5in]">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: sectionSpacing,
        }}
      >
        <CvHeader editable={editable} />
        {cvData?.data?.sections.map((section) => {
          const Component = SECTION_COMPONENTS[section.id];
          if (!Component) return null;
          return <Component key={section.id} editable={editable} />;
        })}
      </div>
    </div>
  );
};

export default ClassicTemplate;
