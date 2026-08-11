package com.intlmedical.service;

import com.intlmedical.dto.response.CaseVO;
import com.intlmedical.mapper.CaseMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CaseService {

    private final CaseMapper caseMapper;
    private final ContentTranslationService translationService;

    private static final List<String> BUILTIN_LANGS = List.of("zh", "en");

    public List<CaseVO> listActive() {
        return listActive("zh");
    }

    public List<CaseVO> listActive(String lang) {
        List<CaseVO> list = caseMapper.selectActiveWithHospital();
        if (!BUILTIN_LANGS.contains(lang)) {
            list.forEach(c -> c.setTranslations(
                translationService.getAll("case", c.getId(), lang)
            ));
        }
        return list;
    }

    public CaseVO getActiveById(Long id) {
        return getActiveById(id, "zh");
    }

    public CaseVO getActiveById(Long id, String lang) {
        CaseVO vo = caseMapper.selectActiveById(id);
        if (vo != null && !BUILTIN_LANGS.contains(lang)) {
            vo.setTranslations(translationService.getAll("case", id, lang));
        }
        return vo;
    }
}
