import "./TestCases.css";

const TestCases = ({ onSelect }) => {
  const testCases = ["ഉറവ", "വള"];

  return (
    <div className="test-cases">
      {testCases.map((testCase, index) => (
        <span
          key={index}
          onClick={() => onSelect(testCase)}
          className="test-case"
        >
          {testCase}
        </span>
      ))}
    </div>
  );
};

export default TestCases;
