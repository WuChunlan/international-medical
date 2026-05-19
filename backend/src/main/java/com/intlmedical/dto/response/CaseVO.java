package com.intlmedical.dto.response;

import com.intlmedical.entity.Case;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class CaseVO extends Case {
    private String hospitalNameZh;
    private String hospitalNameEn;
}
