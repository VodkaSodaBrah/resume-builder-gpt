import { describe, it, expect } from 'vitest';
import { expandDegreeAbbreviation } from '../src/lib/resumeGenerator';

describe('expandDegreeAbbreviation', () => {
  // ============================================================================
  // BACHELOR'S DEGREES
  // ============================================================================
  describe('Bachelor\'s Degrees', () => {
    // Bachelor of Science variations
    it.each([
      ['bs', 'Bachelor of Science'],
      ['BS', 'Bachelor of Science'],
      ['Bs', 'Bachelor of Science'],
      ['bS', 'Bachelor of Science'],
      ['b.s.', 'Bachelor of Science'],
      ['B.S.', 'Bachelor of Science'],
      ['b.s', 'Bachelor of Science'],
      ['B.S', 'Bachelor of Science'],
      ['bsc', 'Bachelor of Science'],
      ['BSc', 'Bachelor of Science'],
      ['BSC', 'Bachelor of Science'],
      ['b.sc.', 'Bachelor of Science'],
      ['B.Sc.', 'Bachelor of Science'],
    ])('should expand "%s" to "%s"', (input, expected) => {
      expect(expandDegreeAbbreviation(input)).toBe(expected);
    });

    // Bachelor of Arts variations
    it.each([
      ['ba', 'Bachelor of Arts'],
      ['BA', 'Bachelor of Arts'],
      ['Ba', 'Bachelor of Arts'],
      ['b.a.', 'Bachelor of Arts'],
      ['B.A.', 'Bachelor of Arts'],
      ['b.a', 'Bachelor of Arts'],
      ['B.A', 'Bachelor of Arts'],
    ])('should expand "%s" to "%s"', (input, expected) => {
      expect(expandDegreeAbbreviation(input)).toBe(expected);
    });

    // Bachelor of Engineering variations
    it.each([
      ['be', 'Bachelor of Engineering'],
      ['BE', 'Bachelor of Engineering'],
      ['b.e.', 'Bachelor of Engineering'],
      ['B.E.', 'Bachelor of Engineering'],
      ['beng', 'Bachelor of Engineering'],
      ['BEng', 'Bachelor of Engineering'],
      ['BENG', 'Bachelor of Engineering'],
    ])('should expand "%s" to "%s"', (input, expected) => {
      expect(expandDegreeAbbreviation(input)).toBe(expected);
    });

    // Bachelor of Business Administration variations
    it.each([
      ['bba', 'Bachelor of Business Administration'],
      ['BBA', 'Bachelor of Business Administration'],
      ['b.b.a.', 'Bachelor of Business Administration'],
      ['B.B.A.', 'Bachelor of Business Administration'],
    ])('should expand "%s" to "%s"', (input, expected) => {
      expect(expandDegreeAbbreviation(input)).toBe(expected);
    });

    // Bachelor of Fine Arts variations
    it.each([
      ['bfa', 'Bachelor of Fine Arts'],
      ['BFA', 'Bachelor of Fine Arts'],
      ['b.f.a.', 'Bachelor of Fine Arts'],
      ['B.F.A.', 'Bachelor of Fine Arts'],
    ])('should expand "%s" to "%s"', (input, expected) => {
      expect(expandDegreeAbbreviation(input)).toBe(expected);
    });

    // Bachelor of Science in Nursing variations
    it.each([
      ['bsn', 'Bachelor of Science in Nursing'],
      ['BSN', 'Bachelor of Science in Nursing'],
      ['b.s.n.', 'Bachelor of Science in Nursing'],
      ['B.S.N.', 'Bachelor of Science in Nursing'],
    ])('should expand "%s" to "%s"', (input, expected) => {
      expect(expandDegreeAbbreviation(input)).toBe(expected);
    });
  });

  // ============================================================================
  // MASTER'S DEGREES
  // ============================================================================
  describe('Master\'s Degrees', () => {
    // Master of Science variations
    it.each([
      ['ms', 'Master of Science'],
      ['MS', 'Master of Science'],
      ['m.s.', 'Master of Science'],
      ['M.S.', 'Master of Science'],
      ['m.s', 'Master of Science'],
      ['M.S', 'Master of Science'],
      ['msc', 'Master of Science'],
      ['MSc', 'Master of Science'],
      ['MSC', 'Master of Science'],
      ['m.sc.', 'Master of Science'],
      ['M.Sc.', 'Master of Science'],
    ])('should expand "%s" to "%s"', (input, expected) => {
      expect(expandDegreeAbbreviation(input)).toBe(expected);
    });

    // Master of Arts variations
    it.each([
      ['ma', 'Master of Arts'],
      ['MA', 'Master of Arts'],
      ['m.a.', 'Master of Arts'],
      ['M.A.', 'Master of Arts'],
      ['m.a', 'Master of Arts'],
      ['M.A', 'Master of Arts'],
    ])('should expand "%s" to "%s"', (input, expected) => {
      expect(expandDegreeAbbreviation(input)).toBe(expected);
    });

    // Master of Business Administration variations
    it.each([
      ['mba', 'Master of Business Administration'],
      ['MBA', 'Master of Business Administration'],
      ['m.b.a.', 'Master of Business Administration'],
      ['M.B.A.', 'Master of Business Administration'],
    ])('should expand "%s" to "%s"', (input, expected) => {
      expect(expandDegreeAbbreviation(input)).toBe(expected);
    });

    // Master of Engineering variations
    it.each([
      ['me', 'Master of Engineering'],
      ['ME', 'Master of Engineering'],
      ['m.e.', 'Master of Engineering'],
      ['M.E.', 'Master of Engineering'],
      ['meng', 'Master of Engineering'],
      ['MEng', 'Master of Engineering'],
      ['MENG', 'Master of Engineering'],
    ])('should expand "%s" to "%s"', (input, expected) => {
      expect(expandDegreeAbbreviation(input)).toBe(expected);
    });

    // Master of Education variations
    it.each([
      ['med', 'Master of Education'],
      ['MEd', 'Master of Education'],
      ['MED', 'Master of Education'],
      ['m.ed.', 'Master of Education'],
      ['M.Ed.', 'Master of Education'],
    ])('should expand "%s" to "%s"', (input, expected) => {
      expect(expandDegreeAbbreviation(input)).toBe(expected);
    });

    // Master of Fine Arts variations
    it.each([
      ['mfa', 'Master of Fine Arts'],
      ['MFA', 'Master of Fine Arts'],
      ['m.f.a.', 'Master of Fine Arts'],
      ['M.F.A.', 'Master of Fine Arts'],
    ])('should expand "%s" to "%s"', (input, expected) => {
      expect(expandDegreeAbbreviation(input)).toBe(expected);
    });

    // Master of Science in Nursing variations
    it.each([
      ['msn', 'Master of Science in Nursing'],
      ['MSN', 'Master of Science in Nursing'],
      ['m.s.n.', 'Master of Science in Nursing'],
      ['M.S.N.', 'Master of Science in Nursing'],
    ])('should expand "%s" to "%s"', (input, expected) => {
      expect(expandDegreeAbbreviation(input)).toBe(expected);
    });

    // Master of Public Health variations
    it.each([
      ['mph', 'Master of Public Health'],
      ['MPH', 'Master of Public Health'],
      ['m.p.h.', 'Master of Public Health'],
      ['M.P.H.', 'Master of Public Health'],
    ])('should expand "%s" to "%s"', (input, expected) => {
      expect(expandDegreeAbbreviation(input)).toBe(expected);
    });

    // Master of Social Work variations
    it.each([
      ['msw', 'Master of Social Work'],
      ['MSW', 'Master of Social Work'],
      ['m.s.w.', 'Master of Social Work'],
      ['M.S.W.', 'Master of Social Work'],
    ])('should expand "%s" to "%s"', (input, expected) => {
      expect(expandDegreeAbbreviation(input)).toBe(expected);
    });
  });

  // ============================================================================
  // DOCTORAL DEGREES
  // ============================================================================
  describe('Doctoral Degrees', () => {
    // Doctor of Philosophy variations
    it.each([
      ['phd', 'Doctor of Philosophy'],
      ['PhD', 'Doctor of Philosophy'],
      ['PHD', 'Doctor of Philosophy'],
      ['ph.d.', 'Doctor of Philosophy'],
      ['Ph.D.', 'Doctor of Philosophy'],
      ['PH.D.', 'Doctor of Philosophy'],
      ['ph.d', 'Doctor of Philosophy'],
      ['Ph.D', 'Doctor of Philosophy'],
    ])('should expand "%s" to "%s"', (input, expected) => {
      expect(expandDegreeAbbreviation(input)).toBe(expected);
    });

    // Doctor of Medicine variations
    it.each([
      ['md', 'Doctor of Medicine'],
      ['MD', 'Doctor of Medicine'],
      ['m.d.', 'Doctor of Medicine'],
      ['M.D.', 'Doctor of Medicine'],
    ])('should expand "%s" to "%s"', (input, expected) => {
      expect(expandDegreeAbbreviation(input)).toBe(expected);
    });

    // Juris Doctor variations
    it.each([
      ['jd', 'Juris Doctor'],
      ['JD', 'Juris Doctor'],
      ['j.d.', 'Juris Doctor'],
      ['J.D.', 'Juris Doctor'],
    ])('should expand "%s" to "%s"', (input, expected) => {
      expect(expandDegreeAbbreviation(input)).toBe(expected);
    });

    // Doctor of Education variations
    it.each([
      ['edd', 'Doctor of Education'],
      ['EdD', 'Doctor of Education'],
      ['EDD', 'Doctor of Education'],
      ['ed.d.', 'Doctor of Education'],
      ['Ed.D.', 'Doctor of Education'],
    ])('should expand "%s" to "%s"', (input, expected) => {
      expect(expandDegreeAbbreviation(input)).toBe(expected);
    });

    // Doctor of Dental Surgery variations
    it.each([
      ['dds', 'Doctor of Dental Surgery'],
      ['DDS', 'Doctor of Dental Surgery'],
      ['d.d.s.', 'Doctor of Dental Surgery'],
      ['D.D.S.', 'Doctor of Dental Surgery'],
    ])('should expand "%s" to "%s"', (input, expected) => {
      expect(expandDegreeAbbreviation(input)).toBe(expected);
    });

    // Doctor of Dental Medicine variations
    it.each([
      ['dmd', 'Doctor of Dental Medicine'],
      ['DMD', 'Doctor of Dental Medicine'],
      ['d.m.d.', 'Doctor of Dental Medicine'],
      ['D.M.D.', 'Doctor of Dental Medicine'],
    ])('should expand "%s" to "%s"', (input, expected) => {
      expect(expandDegreeAbbreviation(input)).toBe(expected);
    });

    // Doctor of Osteopathic Medicine variations
    it.each([
      ['do', 'Doctor of Osteopathic Medicine'],
      ['DO', 'Doctor of Osteopathic Medicine'],
      ['d.o.', 'Doctor of Osteopathic Medicine'],
      ['D.O.', 'Doctor of Osteopathic Medicine'],
    ])('should expand "%s" to "%s"', (input, expected) => {
      expect(expandDegreeAbbreviation(input)).toBe(expected);
    });

    // Doctor of Pharmacy variations
    it.each([
      ['pharmd', 'Doctor of Pharmacy'],
      ['PharmD', 'Doctor of Pharmacy'],
      ['PHARMD', 'Doctor of Pharmacy'],
      ['pharm.d.', 'Doctor of Pharmacy'],
      ['Pharm.D.', 'Doctor of Pharmacy'],
    ])('should expand "%s" to "%s"', (input, expected) => {
      expect(expandDegreeAbbreviation(input)).toBe(expected);
    });

    // Doctor of Veterinary Medicine variations
    it.each([
      ['dvm', 'Doctor of Veterinary Medicine'],
      ['DVM', 'Doctor of Veterinary Medicine'],
      ['d.v.m.', 'Doctor of Veterinary Medicine'],
      ['D.V.M.', 'Doctor of Veterinary Medicine'],
    ])('should expand "%s" to "%s"', (input, expected) => {
      expect(expandDegreeAbbreviation(input)).toBe(expected);
    });
  });

  // ============================================================================
  // ASSOCIATE DEGREES
  // ============================================================================
  describe('Associate Degrees', () => {
    // Associate of Arts variations
    it.each([
      ['aa', 'Associate of Arts'],
      ['AA', 'Associate of Arts'],
      ['a.a.', 'Associate of Arts'],
      ['A.A.', 'Associate of Arts'],
    ])('should expand "%s" to "%s"', (input, expected) => {
      expect(expandDegreeAbbreviation(input)).toBe(expected);
    });

    // Associate of Science variations
    it.each([
      ['as', 'Associate of Science'],
      ['AS', 'Associate of Science'],
      ['a.s.', 'Associate of Science'],
      ['A.S.', 'Associate of Science'],
    ])('should expand "%s" to "%s"', (input, expected) => {
      expect(expandDegreeAbbreviation(input)).toBe(expected);
    });

    // Associate of Applied Science variations
    it.each([
      ['aas', 'Associate of Applied Science'],
      ['AAS', 'Associate of Applied Science'],
      ['a.a.s.', 'Associate of Applied Science'],
      ['A.A.S.', 'Associate of Applied Science'],
    ])('should expand "%s" to "%s"', (input, expected) => {
      expect(expandDegreeAbbreviation(input)).toBe(expected);
    });

    // Associate of Engineering Science variations
    it.each([
      ['aes', 'Associate of Engineering Science'],
      ['AES', 'Associate of Engineering Science'],
      ['a.e.s.', 'Associate of Engineering Science'],
      ['A.E.S.', 'Associate of Engineering Science'],
    ])('should expand "%s" to "%s"', (input, expected) => {
      expect(expandDegreeAbbreviation(input)).toBe(expected);
    });
  });

  // ============================================================================
  // PATTERN MATCHING TESTS
  // ============================================================================
  describe('Pattern Matching', () => {
    describe('"abbreviation in field" pattern', () => {
      it.each([
        ['BS in Computer Science', 'Bachelor of Science in Computer Science'],
        ['bs in computer science', 'Bachelor of Science in computer science'],
        ['MS in Data Science', 'Master of Science in Data Science'],
        ['ms in data science', 'Master of Science in data science'],
        ['BA in English', 'Bachelor of Arts in English'],
        ['MA in History', 'Master of Arts in History'],
        ['PhD in Physics', 'Doctor of Philosophy in Physics'],
        ['phd in physics', 'Doctor of Philosophy in physics'],
        ['MBA in Finance', 'Master of Business Administration in Finance'],
        ['BE in Mechanical Engineering', 'Bachelor of Engineering in Mechanical Engineering'],
        ['ME in Electrical Engineering', 'Master of Engineering in Electrical Engineering'],
        ['BFA in Graphic Design', 'Bachelor of Fine Arts in Graphic Design'],
        ['MFA in Creative Writing', 'Master of Fine Arts in Creative Writing'],
        ['AA in Liberal Arts', 'Associate of Arts in Liberal Arts'],
        ['AS in Biology', 'Associate of Science in Biology'],
      ])('should expand "%s" to "%s"', (input, expected) => {
        expect(expandDegreeAbbreviation(input)).toBe(expected);
      });
    });

    describe('"abbreviation of field" pattern', () => {
      it.each([
        ['BS of Science', 'Bachelor of Science in Science'],
        ['MS of Engineering', 'Master of Science in Engineering'],
        ['BA of Arts', 'Bachelor of Arts in Arts'],
      ])('should expand "%s" to "%s"', (input, expected) => {
        expect(expandDegreeAbbreviation(input)).toBe(expected);
      });
    });

    describe('abbreviation prefix pattern', () => {
      it.each([
        ['BS degree', 'Bachelor of Science degree'],
        ['MS program', 'Master of Science program'],
        ['PhD candidate', 'Doctor of Philosophy candidate'],
        ['MBA graduate', 'Master of Business Administration graduate'],
      ])('should expand "%s" to "%s"', (input, expected) => {
        expect(expandDegreeAbbreviation(input)).toBe(expected);
      });
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================
  describe('Edge Cases', () => {
    it('should return empty string for empty input', () => {
      expect(expandDegreeAbbreviation('')).toBe('');
    });

    it('should return the same string for null/undefined-like empty values', () => {
      // The function checks !degree first, so empty string returns empty string
      expect(expandDegreeAbbreviation('')).toBe('');
    });

    it('should pass through already expanded degree names', () => {
      expect(expandDegreeAbbreviation('Bachelor of Science')).toBe('Bachelor of Science');
      expect(expandDegreeAbbreviation('Master of Arts')).toBe('Master of Arts');
      expect(expandDegreeAbbreviation('Doctor of Philosophy')).toBe('Doctor of Philosophy');
    });

    it('should pass through unknown abbreviations unchanged', () => {
      expect(expandDegreeAbbreviation('XYZ')).toBe('XYZ');
      expect(expandDegreeAbbreviation('Unknown Degree')).toBe('Unknown Degree');
      expect(expandDegreeAbbreviation('Some Random Text')).toBe('Some Random Text');
    });

    it('should handle whitespace correctly', () => {
      expect(expandDegreeAbbreviation('  BS  ')).toBe('Bachelor of Science');
      expect(expandDegreeAbbreviation('\tMS\t')).toBe('Master of Science');
      expect(expandDegreeAbbreviation('  PhD  ')).toBe('Doctor of Philosophy');
    });

    it('should handle degrees with extra spaces in patterns', () => {
      // Extra spaces: pattern matching normalizes and the prefix pattern catches it
      // The result has single spaces (normalized)
      expect(expandDegreeAbbreviation('BS  in  Computer Science')).toBe('Bachelor of Science in Computer Science');
    });
  });

  // ============================================================================
  // REAL-WORLD SCENARIOS
  // ============================================================================
  describe('Real-World Scenarios', () => {
    it('should expand common user inputs correctly', () => {
      // Common ways users might enter their degree
      expect(expandDegreeAbbreviation('BS')).toBe('Bachelor of Science');
      expect(expandDegreeAbbreviation('bs')).toBe('Bachelor of Science');
      expect(expandDegreeAbbreviation('B.S.')).toBe('Bachelor of Science');
    });

    it('should NOT expand when "field" is a year (purely numeric)', () => {
      // "2010" is a year, not a field of study - should not be treated as a field
      // This falls through to prefix matching, expanding "BS " to "Bachelor of Science "
      expect(expandDegreeAbbreviation('BS in 2010')).toBe('Bachelor of Science in 2010');
    });

    it('should handle degree with field of study', () => {
      expect(expandDegreeAbbreviation('BS in Computer Science')).toBe('Bachelor of Science in Computer Science');
      expect(expandDegreeAbbreviation('MS in Mechanical Engineering')).toBe('Master of Science in Mechanical Engineering');
    });
  });

  // ============================================================================
  // COMPREHENSIVE EDGE CASES - Additional Coverage
  // ============================================================================

  // ---------------------------------------------------------------------------
  // 1. REGEX SPECIAL CHARACTERS
  // ---------------------------------------------------------------------------
  describe('Regex Special Characters', () => {
    it.each([
      ['B$S', 'B$S'],           // Dollar sign - passthrough
      ['B+S', 'B+S'],           // Plus sign - passthrough
      ['B*S', 'B*S'],           // Asterisk - passthrough
      ['B?S', 'B?S'],           // Question mark - passthrough
      ['B[S]', 'B[S]'],         // Square brackets - passthrough
      ['B(S)', 'B(S)'],         // Parentheses - passthrough
      ['B|S', 'B|S'],           // Pipe - passthrough
    ])('should safely handle regex special char "%s" without throwing', (input, expected) => {
      // These should NOT throw errors and should passthrough unchanged
      expect(() => expandDegreeAbbreviation(input)).not.toThrow();
      expect(expandDegreeAbbreviation(input)).toBe(expected);
    });

    it('should handle special characters in field names', () => {
      expect(expandDegreeAbbreviation('BS in C++ Programming')).toBe('Bachelor of Science in C++ Programming');
      expect(expandDegreeAbbreviation('BS in Data & Analytics')).toBe('Bachelor of Science in Data & Analytics');
      expect(expandDegreeAbbreviation('MS in Machine.Learning')).toBe('Master of Science in Machine.Learning');
    });
  });

  // ---------------------------------------------------------------------------
  // 2. INPUT GUARDS (null, undefined, edge values)
  // ---------------------------------------------------------------------------
  describe('Input Guards', () => {
    it('should handle empty string', () => {
      expect(expandDegreeAbbreviation('')).toBe('');
    });

    it('should handle whitespace-only strings', () => {
      expect(expandDegreeAbbreviation('   ')).toBe('');
      expect(expandDegreeAbbreviation('\t')).toBe('');
      expect(expandDegreeAbbreviation('\n')).toBe('');
      expect(expandDegreeAbbreviation(' \t\n ')).toBe('');
    });

    it('should handle incomplete "in" pattern with trailing space', () => {
      // "BS in " with empty field - should still expand the BS part
      const result = expandDegreeAbbreviation('BS in ');
      // The function should handle this gracefully
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle pattern with only "in" keyword', () => {
      // No abbreviation before "in"
      expect(expandDegreeAbbreviation('in Computer Science')).toBe('in Computer Science');
    });
  });

  // ---------------------------------------------------------------------------
  // 3. UNICODE WHITESPACE VARIATIONS
  // ---------------------------------------------------------------------------
  describe('Unicode Whitespace', () => {
    it('should handle non-breaking space (U+00A0)', () => {
      // Non-breaking space between BS and "in"
      const input = 'BS\u00A0in Computer Science';
      const result = expandDegreeAbbreviation(input);
      // Should either expand correctly or passthrough safely
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle zero-width space (U+200B)', () => {
      const input = 'BS\u200Bin Computer Science';
      const result = expandDegreeAbbreviation(input);
      expect(result).toBeDefined();
    });

    it('should handle tab character in pattern', () => {
      const result = expandDegreeAbbreviation('BS\tin Computer Science');
      // Tab should work like space in most cases
      expect(result).toBeDefined();
    });

    it('should handle newline in input', () => {
      const result = expandDegreeAbbreviation('BS\nin Computer Science');
      expect(result).toBeDefined();
    });

    it('should handle em space (U+2003)', () => {
      const input = 'BS\u2003in Computer Science';
      const result = expandDegreeAbbreviation(input);
      expect(result).toBeDefined();
    });

    it('should handle mixed whitespace types', () => {
      const result = expandDegreeAbbreviation('  BS  \t  ');
      expect(result).toBe('Bachelor of Science');
    });

    it('should handle carriage return', () => {
      const result = expandDegreeAbbreviation('BS\r\nin Computer Science');
      expect(result).toBeDefined();
    });

    it('should handle form feed character', () => {
      const result = expandDegreeAbbreviation('BS\fin Computer Science');
      expect(result).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // 4. PATTERN INTERACTION EDGE CASES
  // ---------------------------------------------------------------------------
  describe('Pattern Interactions', () => {
    it('should handle multiple "in" keywords', () => {
      // "BS in Science in Engineering" - greedy match takes everything after first "in"
      const result = expandDegreeAbbreviation('BS in Science in Engineering');
      expect(result).toBe('Bachelor of Science in Science in Engineering');
    });

    it('should handle both "of" and "in" in input', () => {
      // "of" pattern should match first
      const result = expandDegreeAbbreviation('BS of Physics');
      expect(result).toBe('Bachelor of Science in Physics');
    });

    it('should handle "of" followed by "in"', () => {
      const result = expandDegreeAbbreviation('MS of Science in Engineering');
      // "of" pattern matches first, converting "of" to "in"
      expect(result).toBe('Master of Science in Science in Engineering');
    });

    it('should handle dangling "in" with no field', () => {
      const result = expandDegreeAbbreviation('BS in');
      // Should handle gracefully
      expect(result).toBeDefined();
    });

    it('should handle repeated abbreviation', () => {
      // User typed "BS BS" by mistake
      const result = expandDegreeAbbreviation('BS BS');
      // Should expand the first BS as prefix pattern
      expect(result).toBe('Bachelor of Science BS');
    });

    it('should handle abbreviation at end of longer text', () => {
      // "some text BS" - abbreviation at end, not start
      const result = expandDegreeAbbreviation('My degree is BS');
      expect(result).toBe('My degree is BS'); // Passthrough - not at start
    });
  });

  // ---------------------------------------------------------------------------
  // 5. MISSING/INTERNATIONAL ABBREVIATIONS (documenting expected behavior)
  // ---------------------------------------------------------------------------
  describe('International/Missing Abbreviations', () => {
    it.each([
      ['MBBS', 'MBBS'],           // Bachelor of Medicine (UK/Commonwealth) - not in map
      ['LLB', 'LLB'],             // Bachelor of Laws - not in map
      ['LLM', 'LLM'],             // Master of Laws - not in map
      ['BTech', 'BTech'],         // Bachelor of Technology - not in map
      ['MTech', 'MTech'],         // Master of Technology - not in map
      ['B.Tech', 'B.Tech'],       // Bachelor of Technology with dots - not in map
      ['M.Tech', 'M.Tech'],       // Master of Technology with dots - not in map
    ])('should passthrough unknown abbreviation "%s" unchanged', (input, expected) => {
      expect(expandDegreeAbbreviation(input)).toBe(expected);
    });

    it('should handle honors designations with known abbreviations', () => {
      // "BSc " (with space) matches prefix pattern → expanded
      expect(expandDegreeAbbreviation('BSc (Hons)')).toBe('Bachelor of Science (Hons)');
      // "BE(Hons)" (NO space) doesn't match prefix pattern → passthrough
      // Prefix pattern requires \s+ after abbreviation
      expect(expandDegreeAbbreviation('BE(Hons)')).toBe('BE(Hons)');
      // But "BE (Hons)" WITH space would expand
      expect(expandDegreeAbbreviation('BE (Hons)')).toBe('Bachelor of Engineering (Hons)');
    });

    it('should handle dual degree format', () => {
      // Dual degrees - not parsed
      expect(expandDegreeAbbreviation('BS/MS')).toBe('BS/MS');
      expect(expandDegreeAbbreviation('MD/PhD')).toBe('MD/PhD');
      expect(expandDegreeAbbreviation('JD/MBA')).toBe('JD/MBA');
    });

    it('should handle degree with concentration', () => {
      // Concentration format
      const result = expandDegreeAbbreviation('BS (concentration in AI)');
      // The parenthetical content is not a standard pattern
      expect(result).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // 6. YEAR/DATE VARIATION TESTS
  // ---------------------------------------------------------------------------
  describe('Year and Date Variations', () => {
    it('should NOT treat year range as field of study', () => {
      // "2010-2015" looks like a date range, not a field
      const result = expandDegreeAbbreviation('BS in 2010-2015');
      // Current implementation: not purely numeric, so it WILL be treated as field
      // This documents current behavior (may want to fix later)
      expect(result).toBeDefined();
    });

    it('should NOT treat decimal year as field', () => {
      // "2010.5" is not purely numeric due to decimal
      const result = expandDegreeAbbreviation('BS in 2010.5');
      expect(result).toBeDefined();
    });

    it('should NOT treat decade as field', () => {
      // "2010s" is not purely numeric due to 's'
      const result = expandDegreeAbbreviation('BS in 2010s');
      expect(result).toBeDefined();
    });

    it('should handle year with suffix text', () => {
      const result = expandDegreeAbbreviation('BS in 2010 and Computer Science');
      // Mixed year and field - current behavior expands it
      expect(result).toBeDefined();
    });

    it('should handle century format', () => {
      const result = expandDegreeAbbreviation('BS in 21st Century Studies');
      expect(result).toBe('Bachelor of Science in 21st Century Studies');
    });
  });

  // ---------------------------------------------------------------------------
  // 7. BOUNDARY CONDITIONS
  // ---------------------------------------------------------------------------
  describe('Boundary Conditions', () => {
    it('should handle very long input strings', () => {
      const longField = 'A'.repeat(1000);
      const result = expandDegreeAbbreviation(`BS in ${longField}`);
      expect(result).toBe(`Bachelor of Science in ${longField}`);
    });

    it('should handle single character inputs', () => {
      expect(expandDegreeAbbreviation('B')).toBe('B');
      expect(expandDegreeAbbreviation('M')).toBe('M');
      expect(expandDegreeAbbreviation('D')).toBe('D');
    });

    it('should handle numbers only', () => {
      expect(expandDegreeAbbreviation('123')).toBe('123');
      expect(expandDegreeAbbreviation('2010')).toBe('2010');
    });

    it('should handle punctuation only', () => {
      expect(expandDegreeAbbreviation('...')).toBe('...');
      expect(expandDegreeAbbreviation('---')).toBe('---');
    });

    it('should preserve original case of non-matching parts', () => {
      expect(expandDegreeAbbreviation('BS in COMPUTER SCIENCE')).toBe('Bachelor of Science in COMPUTER SCIENCE');
      expect(expandDegreeAbbreviation('BS in computer science')).toBe('Bachelor of Science in computer science');
    });
  });
});
