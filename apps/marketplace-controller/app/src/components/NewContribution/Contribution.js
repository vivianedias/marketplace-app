import React, { useEffect, useContext, useRef, useState } from 'react'
import styled from 'styled-components'
import { useApi, useAppState, useConnectedAccount } from '@aragon/api-react'
import { Button, Text, TextInput, theme, unselectable, GU } from '@aragon/ui'
import { PresaleViewContext } from '../../context'
import Total from './Total'
import Info from './Info'
import ValidationError from '../ValidationError'
import { toDecimals, formatBigNumber } from '../../utils/bn-utils'

export default () => {
  // *****************************
  // background script state
  // *****************************
  const {
    addresses: { presale },
    collaterals,
    presale: {
      contributionToken: { symbol: contributionSymbol, decimals: contributionDecimals },
    },
  } = useAppState()

  // *****************************
  // aragon api
  // *****************************
  const api = useApi()
  const account = useConnectedAccount()

  // *****************************
  // context state
  // *****************************
  const { presalePanel, setPresalePanel, userPrimaryCollateralBalance } = useContext(PresaleViewContext)
  // *****************************
  // internal state
  // *****************************
  const [value, setValue] = useState('')
  const [valid, setValid] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const valueInput = useRef(null)

  // *****************************
  // effects
  // *****************************
  // handle reset when opening
  useEffect(() => {
    if (presalePanel) {
      // reset to default values
      setValue('')
      setValid(false)
      setErrorMessage(null)

      // Focus the right input after some time to avoid the panel transition to
      // be skipped by the browser.
      valueInput && setTimeout(() => valueInput.current.focus(), 100)
    }
  }, [presalePanel])

  // *****************************
  // handlers
  // *****************************
  const handleValueUpdate = event => {
    setValue(event.target.value)
  }

  const validate = (err, message) => {
    setValid(err)
    setErrorMessage(message)
  }

  const handleSubmit = event => {
    event.preventDefault()
    if (account) {
      const intent = { token: { address: collaterals.primaryCollateral.address, value: toDecimals(value, contributionDecimals).toFixed(), spender: presale } }
      api
        .contribute(toDecimals(value, contributionDecimals).toFixed(), intent)
        .toPromise()
        .catch(console.error)
    }
    setPresalePanel(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      <InputsWrapper>
        <p
          css={`
            margin: ${2 * GU}px 0;
          `}
        >
          Your balance: {formatBigNumber(userPrimaryCollateralBalance, contributionDecimals)} {contributionSymbol}
        </p>
        <ValueField key="collateral">
          <label>
            <StyledTextBlock>{contributionSymbol} TO SPEND</StyledTextBlock>
          </label>
          <TextInput ref={valueInput} type="number" value={value} onChange={handleValueUpdate} min={0} placeholder="0" step="any" required wide />
        </ValueField>
      </InputsWrapper>
      <Total value={value} onError={validate} />
      <ButtonWrapper>
        <Button mode="strong" type="submit" disabled={!valid || !account} wide>
          Buy presale shares
        </Button>
      </ButtonWrapper>
      {errorMessage && <ValidationError messages={[errorMessage]} />}
      <Info />
    </form>
  )
}

const ButtonWrapper = styled.div`
  padding-top: 10px;
`

const ValueField = styled.div`
  margin-bottom: 20px;
`

const InputsWrapper = styled.div`
  display: flex;
  flex-direction: column;
`

const StyledTextBlock = styled(Text.Block).attrs({
  color: theme.textSecondary,
  smallcaps: true,
})`
  ${unselectable()};
  display: flex;
`
